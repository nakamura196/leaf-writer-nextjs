"use strict";
(self["webpackChunkLeafwriter"] = self["webpackChunkLeafwriter"] || []).push([[539],{

/***/ 16539:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  Editor: () => (/* binding */ Editor)
});

// EXTERNAL MODULE: ../../node_modules/react/jsx-runtime.js
var jsx_runtime = __webpack_require__(73859);
// EXTERNAL MODULE: ../../node_modules/@mui/material/styles/useTheme.js
var useTheme = __webpack_require__(43792);
// EXTERNAL MODULE: ../../node_modules/jotai/esm/react.mjs
var react = __webpack_require__(42032);
// EXTERNAL MODULE: include-loader!./node_modules/monaco-editor/esm/vs/editor/editor.api.js + 487 modules
var editor_api = __webpack_require__(47537);
// EXTERNAL MODULE: ../../node_modules/react/index.js
var node_modules_react = __webpack_require__(59811);
// EXTERNAL MODULE: ./src/dialogs/editSource/store.ts
var store = __webpack_require__(17847);
;// CONCATENATED MODULE: ./src/dialogs/editSource/hooks/useEditor.ts





const useEditor = (editor) => {
  const xmlValidity = (0,react/* useAtomValue */.md)(store/* xmlValidityAtom */.$p);
  const [decorations, setDecorations] = (0,node_modules_react.useState)(void 0);
  (0,node_modules_react.useEffect)(() => {
    updateDecorations();
  }, [xmlValidity.valid || xmlValidity.error.message]);
  const updateDecorations = () => {
    decorations?.clear();
    if (xmlValidity.valid || !xmlValidity.error.positions)
      return;
    const _decorations = editor?.createDecorationsCollection(
      xmlValidity.error.positions.map((pos) => {
        return {
          range: new editor_api/* Range */.Q6(pos.line, 0, pos.line, pos.col),
          options: {
            className: "monaco-editor-error-line",
            isWholeLine: true,
            minimap: {
              color: "rgba(255, 0, 0, 0.2)",
              position: 1
            }
          }
        };
      })
    );
    setDecorations(_decorations);
  };
  return {
    updateDecorations
  };
};

;// CONCATENATED MODULE: ./src/dialogs/editSource/editor.tsx








const Editor = ({ initialContent, type }) => {
  const { palette } = (0,useTheme/* default */.A)();
  const setCurrentContent = (0,react/* useSetAtom */.Xr)(store/* currentContentAtom */.iT);
  const setOriginalContent = (0,react/* useSetAtom */.Xr)(store/* originalContentAtom */.OP);
  const setType = (0,react/* useSetAtom */.Xr)(store/* contentTypeAtom */.BR);
  const [editor, setEditor] = (0,node_modules_react.useState)(null);
  const divEl = (0,node_modules_react.useRef)(null);
  useEditor(editor);
  (0,node_modules_react.useEffect)(() => {
    setOriginalContent(initialContent);
    setType(type);
    if (divEl.current) {
      setCurrentContent(initialContent);
      const monacoEditor = editor_api/* editor */.EN.create(divEl.current, {
        lineNumbers: "on",
        language: "xml",
        theme: palette.mode === "dark" ? "vs-dark" : "vs-light",
        value: initialContent,
        wordWrap: "wordWrapColumn",
        wordWrapColumn: 100,
        wrappingIndent: "indent"
      });
      monacoEditor.getModel()?.onDidChangeContent(() => {
        const content = monacoEditor.getValue();
        setCurrentContent(content);
      });
      setEditor(monacoEditor);
    }
    return () => {
      editor?.dispose();
    };
  }, []);
  return /* @__PURE__ */ (0,jsx_runtime.jsx)("div", { className: "Editor", ref: divEl, style: { minHeight: 600 } });
};


/***/ })

}]);
//# sourceMappingURL=539.js.map