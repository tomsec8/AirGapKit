import React, { useState } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { AppShell } from '../../components/layout/AppShell';
import { HomePage } from '../../components/tools/HomePage';

// Modular Feature Imports
// PDF Cluster
import { MergePdf } from '../../components/tools/pdf/MergePdf';
import { PdfPageManager } from '../../components/tools/pdf/PdfPageManager';
import { CompressPdf } from '../../components/tools/pdf/CompressPdf';
import { SignPdf } from '../../components/tools/pdf/SignPdf';
import { FillFormPdf } from '../../components/tools/pdf/FillFormPdf';
import { WatermarkNumPdf } from '../../components/tools/pdf/WatermarkNumPdf';
import { PdfSecBi } from '../../components/tools/pdf/PdfSecBi';
import { PdfCompare } from '../../components/tools/pdf/PdfCompare';
import { PdfRepair } from '../../components/tools/pdf/PdfRepair';
import { PdfViewer } from '../../components/tools/pdf/PdfViewer';
import { CropPdf } from '../../components/tools/pdf/CropPdf';
import { FlattenPdf } from '../../components/tools/pdf/FlattenPdf';
// Image Cluster
import { ImageEditor } from '../../components/tools/image/ImageEditor';
import { CamScanner } from '../../components/tools/image/CamScanner';
import { CompressImage } from '../../components/tools/image/CompressImage';
import { BlurAnonymize } from '../../components/tools/image/BlurAnonymize';
import { WatermarkImage } from '../../components/tools/image/WatermarkImage';
import { BgRemover } from '../../components/tools/image/BgRemover';

// Security Cluster
import { MetadataStripperView } from '../../modules/security/metadataStripper/MetadataStripperView';
import { FileHashView } from '../../modules/security/fileHash/FileHashView';
import { FileCompareView } from '../../modules/security/fileCompare/FileCompareView';
import { FileEncrypt } from '../../components/tools/security/FileEncrypt';
import { PassGen } from '../../components/tools/security/PassGen';
import { FileShredder } from '../../components/tools/security/FileShredder';

// Office Cluster
import { ExcelJsonBi } from '../../components/tools/office/ExcelJsonBi';
import { MergeCsv } from '../../components/tools/office/MergeCsv';
import { WordToText } from '../../components/tools/office/WordToText';
import { OfficeViewer } from '../../components/tools/office/OfficeViewer';

// Text & Data Cluster
import { TextCleaner } from '../../components/tools/textData/TextCleaner';
import { TextInspector } from '../../components/tools/textData/TextInspector';
import { DataExtractor } from '../../components/tools/textData/DataExtractor';
import { TextDiff } from '../../components/tools/textData/TextDiff';
import { JsonFormatter } from '../../components/tools/textData/JsonFormatter';
import { Base64Tool } from '../../components/tools/textData/Base64Tool';
import { MarkdownEditor } from '../../components/tools/textData/MarkdownEditor';

// Convert Cluster
import { PdfImageBi } from '../../components/tools/convert/PdfImageBi';
import { WordPdfBi } from '../../components/tools/convert/WordPdfBi';
import { SvgImageBi } from '../../components/tools/convert/SvgImageBi';
import { MediaExtractor } from '../../components/tools/convert/MediaExtractor';
import { PdfToZip } from '../../components/tools/convert/PdfToZip';
import { ImageConverter } from '../../components/tools/convert/ImageConverter';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<AppShell />}>
          <Route index element={<HomePage />} />

          {/* Text & Data Cluster Modules */}
          <Route path="text/cleaner-suite" element={<TextCleaner />} />
          <Route path="text/inspector-case" element={<TextInspector />} />
          <Route path="text/data-extractor" element={<DataExtractor />} />
          <Route path="text/diff" element={<TextDiff />} />
          <Route path="text/json" element={<JsonFormatter />} />
          <Route path="text/base64" element={<Base64Tool />} />
          <Route path="text/markdown" element={<MarkdownEditor />} />

          {/* Office Cluster Modules */}
          <Route path="office/excel-json" element={<ExcelJsonBi />} />
          <Route path="convert/excel-json" element={<ExcelJsonBi />} />
          <Route path="office/merge-csv" element={<MergeCsv />} />
          <Route path="office/word-text" element={<WordToText />} />
          <Route path="office/viewer" element={<OfficeViewer />} />

          {/* PDF Cluster Modules */}
          <Route path="pdf/merge" element={<MergePdf />} />
          <Route path="pdf/page-manager" element={<PdfPageManager />} />
          <Route path="pdf/compress" element={<CompressPdf />} />
          <Route path="pdf/sign" element={<SignPdf />} />
          <Route path="pdf/fill-form" element={<FillFormPdf />} />
          <Route path="pdf/watermark-numbers" element={<WatermarkNumPdf />} />
          <Route path="pdf/security-bi" element={<PdfSecBi />} />
          <Route path="pdf/compare" element={<PdfCompare />} />
          <Route path="pdf/repair" element={<PdfRepair />} />
          <Route path="pdf/viewer" element={<PdfViewer />} />
          <Route path="pdf/crop" element={<CropPdf />} />
          <Route path="pdf/flatten" element={<FlattenPdf />} />
          
          {/* Security Cluster Modules */}
          <Route path="security/metadata-strip" element={<MetadataStripperView />} />
          <Route path="security/file-hash" element={<FileHashView />} />
          <Route path="security/file-compare" element={<FileCompareView />} />
          <Route path="security/file-encrypt" element={<FileEncrypt />} />
          <Route path="security/pass-gen" element={<PassGen />} />
          <Route path="security/file-shredder" element={<FileShredder />} />

          {/* Convert Cluster Modules */}
          <Route path="convert/pdf-image" element={<PdfImageBi />} />
          <Route path="convert/word-pdf" element={<WordPdfBi />} />
          <Route path="convert/svg-image" element={<SvgImageBi />} />
          <Route path="convert/media-extractor" element={<MediaExtractor />} />
          <Route path="convert/pdf-to-zip" element={<PdfToZip />} />
          <Route path="convert/image-converter" element={<ImageConverter />} />

          {/* Image Cluster Modules */}
          <Route path="image/editor-suite" element={<ImageEditor />} />
          <Route path="image/camscanner" element={<CamScanner />} />
          <Route path="image/compress" element={<CompressImage />} />
          <Route path="image/blur-anonymize" element={<BlurAnonymize />} />
          <Route path="image/watermark" element={<WatermarkImage />} />
          <Route path="image/bg-remover" element={<BgRemover />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
