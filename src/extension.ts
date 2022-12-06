import * as vscode from "vscode";
import * as path from "path";
import { spawn } from "promisify-child-process";

async function blameLine(filePath: string, lineNo: number): Promise<string> {
  try {
    const { stdout, stderr, code } = await spawn(
      "git",
      ["blame", "-p", `-L${lineNo},+1`, filePath],
      { encoding: "utf-8", cwd: path.dirname(filePath) }
    );
    if (typeof stdout !== "string") {
      throw new Error("Couldn't blame current file: no output");
    }
    return stdout;
  } catch (err) {
    throw new Error(`Couldn't blame current file: ${err}`);
  }
}

async function showCurrentLineInGitk() {
  const editor = vscode.window?.activeTextEditor;

  if (editor === undefined) {
    vscode.window.showInformationMessage(
      "Show current line in gitk: No editor window in focus"
    );
    return;
  }

  if (editor.document.uri.scheme !== "file") {
    vscode.window.showInformationMessage(
      "Show current line in gitk: document is not a file saved on disk"
    );
    return;
  }

  const filePath = editor.document.uri.fsPath;
  const lineNo = editor.selection.start.line + 1;

  const blameOutput = await blameLine(filePath, lineNo);
  const blameOutputLines: string[] = blameOutput.split("\n");
  const fieldsInFirstLine = blameOutputLines[0].split(/\s+/);
  const commit = fieldsInFirstLine[0];
  const line = Number(fieldsInFirstLine[1]);

  const file = blameOutputLines
    .filter((s) => {
      return s.startsWith("filename ");
    })[0]
    .substr(9);
  const dateInSeconds = Number(
    blameOutputLines
      .filter((s) => {
        return s.startsWith("committer-time ");
      })[0]
      .substr(15)
  );

  // Show commits starting two weeks after the one we found:
  const twoWeeksLater = dateInSeconds + 60 * 60 * 24 * 7 * 2;

  await spawn(
    "gitk",
    [
      `--before=${twoWeeksLater}`,
      `--select-commit=${commit}`,
      `--select-file=${file}`,
      `--select-line=${line}`,
    ],
    { cwd: path.dirname(filePath) }
  );
}

async function showLogForCurrentLineRangeInGitk() {
  const editor = vscode.window?.activeTextEditor;

  if (editor === undefined) {
    vscode.window.showInformationMessage(
      "Show log for current line range in gitk: No editor window in focus"
    );
    return;
  }

  if (editor.document.uri.scheme !== "file") {
    vscode.window.showInformationMessage(
      "Show log for current line range in gitk: document is not a file saved on disk"
    );
    return;
  }

  const filePath = editor.document.uri.fsPath;
  const start = editor.selection.start;
  const end = editor.selection.end;
  const startLine = start.line + 1;
  const endLine =
    end.line > start.line && end.character === 0 ? end.line : end.line + 1;

  await spawn("gitk", [`-L${startLine},${endLine}:${filePath}`], {
    cwd: path.dirname(filePath),
  });
}

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "vscode-gitk-blame.showCurrentLineInGitk",
      async () => {
        try {
          await showCurrentLineInGitk();
        } catch (err) {
          vscode.window.showErrorMessage(`${err}`);
        }
      }
    )
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "vscode-gitk-blame.showLogForCurrentLineRangeInGitk",
      async () => {
        try {
          await showLogForCurrentLineRangeInGitk();
        } catch (err) {
          vscode.window.showErrorMessage(`${err}`);
        }
      }
    )
  );
}
