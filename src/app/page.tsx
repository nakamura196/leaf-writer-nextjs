"use client";

import { useEffect, useState } from "react";
import type { Leafwriter } from "@cwrc/leafwriter";

//* This only tells typescript that Leafwriter exists on the global scope (Window) */
declare global {
  interface Window {
    Leafwriter: {
      Leafwriter: typeof Leafwriter;
    };
  }
}

export default function Home() {
  const [editor, setEditor] = useState<Leafwriter>();

  useEffect(() => {
    if (typeof window !== "undefined" && window.Leafwriter) {
      const container = document.getElementById("leaf-writer-container");

      if (!container) {
        throw new Error("Container not found");
      }

      // LEAF-Writerのインスタンスを生成
      const editor = new window.Leafwriter.Leafwriter(container);

      // 簡単なTEI/XMLデータ
      const teiXML = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-model href="https://www.tei-c.org/release/xml/tei/custom/schema/relaxng/tei_all.rng" type="application/xml" schematypens="http://relaxng.org/ns/structure/1.0"?>
<?xml-model href="https://www.tei-c.org/release/xml/tei/custom/schema/relaxng/tei_all.rng" type="application/xml"
	schematypens="http://purl.oclc.org/dsdl/schematron"?>
<TEI xmlns="http://www.tei-c.org/ns/1.0">
  <teiHeader>
      <fileDesc>
         <titleStmt>
            <title>Title</title>
         </titleStmt>
         <publicationStmt>
            <p>Publication Information</p>
         </publicationStmt>
         <sourceDesc>
            <p>Information about the source</p>
         </sourceDesc>
      </fileDesc>
  </teiHeader>
  <text>
      <body>
         <p>Some text here.</p>
      </body>
   </text>
</TEI>
`;

      editor.init({
        document: {
          xml: teiXML, // XMLドキュメントの内容
        },
        settings: {
          baseUrl: "/leafwriter", // 必要なリソースのパス
        },
      });

      setEditor(editor);
    }
  }, []);

  const download = async () => {
    if (!editor) {
      return;
    }
    const currentContent = await editor.getContent();
    if (!currentContent) {
      return;
    }
    const blob = new Blob([currentContent], { type: "text/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "download.xml";
    a.click();
  };

  return (
    <>
      <header className="bg-white">
        <nav
          className="mx-auto flex max-w-7xl items-center justify-between p-6 lg:px-8"
          aria-label="Global"
        >
          <div className="flex lg:flex-1">
            <a className="-m-1.5 p-1.5">LEAF Writer Next.js Demo</a>
          </div>
          <div className="hidden lg:flex lg:flex-1 lg:justify-end">
            <button
              onClick={download}
              className="rounded-md bg-indigo-600 px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              ダウンロード
            </button>
          </div>
        </nav>
      </header>
      <div
        id="leaf-writer-container"
        style={{ height: "calc(100% - 72px)", width: "100%" }}
      />
    </>
  );
}
