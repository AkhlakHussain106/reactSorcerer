import React, { useState, useEffect } from "react";
import {
  Editor,
  EditorState,
  RichUtils,
  getDefaultKeyBinding,
  convertToRaw,
  convertFromRaw,
  Modifier,
} from "draft-js";

import "draft-js/dist/Draft.css";
import "../Editor/TextEditor.css";
import {
  editorContent,
  handled,
  notHandled,
  codeBlock} from "../../Utils"
import {
  getStorage,
  setStorage,
  jsonParse,
  jsonStringify,
} from "../../Helper";

export const TextEditor = () => {
  const [editorState, setEditorState] = useState(EditorState.createEmpty());

  useEffect(() => {
    const savedContent = getStorage(editorContent);
    if (savedContent) {
      const contentState = convertFromRaw(jsonParse(savedContent));
      setEditorState(EditorState.createWithContent(contentState));
    }
  }, []);

  const handleKeyCommand = (command, state) => {
    const newState = RichUtils.handleKeyCommand(state, command);
    if (newState) {
      setEditorState(newState);
      return handled;
    }
    return notHandled;
  };

  const keyBindingFn = (e) => {
    if (e.keyCode === 32 && e.shiftKey && e.altKey) {
      return codeBlock;
    }
    return getDefaultKeyBinding(e);
  };

  const handleInputChange = (newEditorState) => {
    setEditorState(newEditorState);
  };

  const handleSave = () => {
    const contentState = editorState.getCurrentContent();
    setStorage(editorContent, jsonStringify(convertToRaw(contentState)));
  };

  const handleReturn = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();

      const contentState = editorState.getCurrentContent();
      const selectionState = editorState.getSelection();
      const currentBlock = contentState.getBlockForKey(
        selectionState.getStartKey()
      );

      // Insert a soft newline character without any style
      const newContentState = Modifier.insertText(
        contentState,
        selectionState,
        "\n"
      );

      // Update the editor state based on whether the current block is empty or not
      let newState;
      if (!currentBlock?.getText()?.trim()) {
        newState = EditorState.push(
          editorState,
          newContentState,
          "insert-char"
        );
      } else {
        const splitBlockState = Modifier.splitBlock(
          newContentState,
          selectionState
        );
        newState = EditorState.push(
          editorState,
          splitBlockState,
          "split-block"
        );
      }

      // Update the editor state with the new state
      setEditorState(
        EditorState.forceSelection(newState, newState.getSelection())
      );

      return handled;
    }
    return notHandled;
  };

  const handleBeforeInput = (char) => {
    const selection = editorState.getSelection();
    const content = editorState.getCurrentContent();
    const block = content.getBlockForKey(selection.getStartKey());
    const blockText = block.getText();

    if (char === " ") {
      const trimmedText = blockText.trim();

      switch (trimmedText) {
        case "#":
          const newBlockText = trimmedText.substring(1);
          const newContentState = Modifier.replaceText(
            content,
            selection.merge({ anchorOffset: 0 }),
            newBlockText
          );
          const newEditorState = EditorState.push(
            editorState,
            newContentState,
            "remove-range"
          );
          handleInputChange(
            RichUtils.toggleBlockType(newEditorState, "header-one")
          );
          break;
        case "*":
          handleInlineStyleChange("BOLD", 1, blockText, content, selection);
          break;
        case "**":
          handleInlineStyleChange("redText", 2, blockText, content, selection);
          break;
        case "***":
          handleInlineStyleChange(
            "UNDERLINE",
            3,
            blockText,
            content,
            selection
          );
          break;
        default:
          return notHandled;
      }

      return handled;
    }

    return notHandled;
  };

  function handleInlineStyleChange(
    style,
    length,
    blockText,
    content,
    selection
  ) {
    const trimmedText = blockText.trim();
    const newBlockText = trimmedText.substring(length);
    const newContentState = Modifier.replaceText(
      content,
      selection.merge({ anchorOffset: 0 }),
      newBlockText
    );
    const newEditorState = EditorState.push(
      editorState,
      newContentState,
      "remove-range"
    );
    handleInputChange(RichUtils.toggleInlineStyle(newEditorState, style));
  }

  return (
    <>
      <h2>Demo Editor by Akhlak Hussain</h2>
      <button onClick={handleSave}>Save</button>
      <div className="editor-container">
        <Editor
          editorState={editorState}
          onChange={handleInputChange}
          handleKeyCommand={handleKeyCommand}
          keyBindingFn={keyBindingFn}
          customStyleMap={customStyleMap}
          handleReturn={handleReturn}
          handleBeforeInput={handleBeforeInput}
        />
      </div>
    </>
  );
};

const customStyleMap = {
  redUnderline: {
    textDecoration: "underline",
    color: "red",
  },
  redText: {
    color: "red",
  },
  codeBlock: {
    backgroundColor: "#f3f3f3",
    fontFamily: "monospace",
    padding: "10px",
    borderRadius: "5px",
  },
};
