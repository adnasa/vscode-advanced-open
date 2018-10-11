import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import * as mkdirp from "mkdirp";

function getEditorPath(): String | undefined {
  return vscode.window.activeTextEditor
    ? path.dirname(vscode.window.activeTextEditor.document.fileName)
    : undefined;
}

function displayFilesInEditorPath(files: Array<string> = []) {
  return vscode.window.showQuickPick(files, {
    placeHolder:
      "This is the input of filtering files in the current folder...",
    matchOnDescription: true,
    matchOnDetail: true
  });
}

function retrieveFilesByPath(editorPath: String): Array<String> {
  const filesInDir = fs.readdirSync(editorPath);
  return filesInDir.filter(
    (fileInDir: String): Boolean =>
      !fs.lstatSync(`${editorPath}/${fileInDir}`).isDirectory()
  );
}

export function createFileOrDirectory(absolutePath: string): void {
  let directoryToFile = path.dirname(absolutePath);
  // @TODO: we determine to create a folder if user's
  // input is e.g `foo/bar.js`
  if (!fs.existsSync(absolutePath)) {
    if (absolutePath.charAt(absolutePath.length - 1) === path.sep) {
      mkdirp.sync(absolutePath);
    } else {
      mkdirp.sync(directoryToFile);
      fs.appendFileSync(absolutePath, "");
    }
  }
}

async function showCurrentFolderCommand() {
  const editorPath: String = getEditorPath();
  const filesInSamePath = retrieveFilesByPath(editorPath);
  const selectedFileOrDirectory = await displayFilesInEditorPath(
    filesInSamePath
  );

  // a user could have selected a directory
  // // either the parent via `INTENT_TO_NAVIGATE_TO_PARENT` or a sub directory
  // when they do so, we navigate into the intended directory and run `retrieveFilesByPath`
  const pathToSelectedFile = `${editorPath}/${selectedFileOrDirectory}`;
  const isDirectory = fs
    .lstatSync(`${editorPath}/${selectedFileOrDirectory}`)
    .isDirectory();

  if (!isDirectory) {
    // createFileOrDirectory(selectedFileOrDirectory);
    const textDocument = await vscode.workspace.openTextDocument(
      pathToSelectedFile
    );
    if (textDocument) {
      vscode.window.showTextDocument(textDocument, vscode.ViewColumn.Active);
    }
  }
}

// This method is called when your extension is activated. Activation is
// controlled by the activation events defined in package.json.
export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand("extension.sayHello", () =>
      showCurrentFolderCommand()
    )
  );
}
