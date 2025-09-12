import { Project, SyntaxKind, type JsxOpeningElement, type JsxSelfClosingElement, type JsxClosingElement } from "ts-morph";
import path from "path";

const project = new Project({
  tsConfigFilePath: path.resolve("tsconfig.json"),
  skipAddingFilesFromTsConfig: false
});

const files = project.getSourceFiles(["apps/**/*.{ts,tsx}", "modules/**/*.{ts,tsx}", "packages/**/*.{ts,tsx}"]);

for (const sf of files) {
  const lucideImports = sf.getImportDeclarations().filter(i => i.getModuleSpecifierValue() === "lucide-react");
  if (lucideImports.length === 0) continue;

  // 1) Fix import specifiers
  for (const imp of lucideImports) {
    const specs = imp.getNamedImports();
    let changed = false;
    for (const s of specs) {
      const name = s.getName();
      if (name.endsWith("Icon")) {
        const newName = name.slice(0, -4);
        s.renameAlias(undefined);
        s.rename(newName);
        changed = true;
      }
    }
    if (changed) imp.formatText();
  }

  // 2) Fix JSX: <EyeIcon /> -> <Eye />
  const fixTag = (node: JsxOpeningElement | JsxSelfClosingElement | JsxClosingElement) => {
    const tag = node.getTagNameNode();
    if (tag.getKind() === SyntaxKind.Identifier) {
      const id = tag.getText();
      if (id.endsWith("Icon")) tag.replaceWithText(id.slice(0, -4));
    }
  };

  sf.forEachDescendant(d => {
    const k = d.getKind();
    if (k === SyntaxKind.JsxSelfClosingElement || k === SyntaxKind.JsxOpeningElement || k === SyntaxKind.JsxClosingElement) {
      // Only mutate if this file imports lucide-react
      fixTag(d as any);
    }
  });
}

project.saveSync();
console.log("✅ lucide-react icon codemod complete");