import * as vscode from 'vscode';
import { request, gql } from 'graphql-request';

const endpoint = 'https://circleci.com/graphql-unstable';
const prefix = 'CircleCi Config Validator';
const maxProblems = 40;

let channel = vscode.window.createOutputChannel(prefix);
let diagnosticCollection = vscode.languages.createDiagnosticCollection(
    'circleci-config-validator'
);

export function activate(context: vscode.ExtensionContext) {
    if (!channel) channel = vscode.window.createOutputChannel(prefix);
    if (!diagnosticCollection) diagnosticCollection = vscode.languages.createDiagnosticCollection(
        'circleci-config-validator'
    );
    let validateFromPalette = vscode.commands.registerCommand(
        'circleci-config-validator.validateFromPalette',
        validate
    );
    context.subscriptions.push(validateFromPalette);
}

export function deactivate() {
    channel && channel.dispose();
    diagnosticCollection && diagnosticCollection.dispose();
}

async function validate() {
    diagnosticCollection.clear();

    const documentUri = vscode.window.activeTextEditor?.document.uri;
    const documentText = JSON.stringify(vscode.window.activeTextEditor?.document.getText()) || '';

    const query = gql`
        {
            buildConfig(
                configYaml: ${documentText},
                pipelineValues:  [
                    {
                        key: "git.base_revision",
                        val: "0123456789abcdef0123456789abcdef0123"
                    },
                    {
                        key: "git.branch",
                        val: "test_git_branch"
                    },
                    {
                        key: "git.revision",
                        val: "0123456789abcdef0123456789abcdef0123"
                    },
                    {
                        key: "git.tag",
                        val: "test_git_tag"
                    },
                    {
                        key: "id",
                        val: "00000000-0000-0000-0000-000000000001"
                    },
                    {
                        key: "number",
                        val: "1"
                    },
                    {
                        key: "project.git_url",
                        val: "https://test.vcs/test/test"
                    },
                    {
                        key: "project.type",
                        val: "vcs_type"
                    }
                ]
            ) {
                valid
                errors {
                    message
                }
                sourceYaml
                outputYaml
            }
        }
    `;
    const { valid, errorLog } = await isValid(query);

    if (valid) {
        vscode.window.showInformationMessage('Valid CircleCi config');
    } else {
        if (documentUri) {
            showProblems(documentUri, errorLog);
        } else {
            channel.appendLine(JSON.stringify(errorLog, undefined, 2));
        }
        vscode.window.showErrorMessage('Invalid CircleCi config');
    }
}

async function isValid(query: string): Promise<{ valid: boolean, errorLog: Array<any> }> {
    let errorLog: [] = [];
    const data = await request(endpoint, query);
    if (data) {
        try {
            errorLog = data.buildConfig.errors || [];
        } catch (error) {
            channel.appendLine(error);
        } finally {
            return data && { valid: data.buildConfig.valid, errorLog };
        }
    }
    return { valid: false, errorLog };
}

function showProblems(documentUri: vscode.Uri, errorLog: Array<{ message: string, [key: string]: any }>) {
    const overflow = errorLog.length - maxProblems;
    let diagnostics: vscode.Diagnostic[] = [];
    for (let idx = 0; idx < maxProblems && idx < errorLog.length; idx++) {
        const log = errorLog[idx];
        const diagnostic = new vscode.Diagnostic(getEmptyRange(), log.message);
        diagnostics.push(diagnostic);
    }
    if (overflow > 0) {
        const diagnostic = new vscode.Diagnostic(getEmptyRange(), `${overflow} more errors not shown here`, 1);
        diagnostics.push(diagnostic);
    }
    diagnosticCollection.set(documentUri, Object.freeze(diagnostics));
}

function getEmptyRange(): vscode.Range {
    return new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 0));
}
