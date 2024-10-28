"use client";

import { useEffect } from "react";
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
    }
  }, []);

  return (
    <div
      id="leaf-writer-container"
      style={{ height: "calc(100% - 72px)", width: "100%" }}
    />
  );
}
