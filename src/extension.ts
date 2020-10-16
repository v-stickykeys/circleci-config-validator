import * as vscode from 'vscode';
import { request, gql } from 'graphql-request';

export function activate(context: vscode.ExtensionContext) {
    const prefix = 'CircleCi Config Validator';
    const channel = vscode.window.createOutputChannel(prefix);
    console.log('Congratulations, your extension "circleci-config-validator" is now active!');

    const endpoint = 'https://circleci.com/graphql-unstable';

    // let validateFromEditor = vscode.commands.registerTextEditorCommand

    let validateFromPalette = vscode.commands.registerCommand('circleci-config-validator.validateFromPalette', async () => {
        const documentText = JSON.stringify(vscode.window.activeTextEditor?.document.getText()) || "";
        const query = gql`
            {
                buildConfig(configYaml: ${documentText}) {
                    valid
                    errors {
                        message
                    }
                    sourceYaml
                    outputYaml
                }
            }
        `;
        const valid = await isValid(query) ;
        if (valid) {
            vscode.window.showInformationMessage('Valid CircleCi config');
        } else {
		    vscode.window.showErrorMessage('Invalid CircleCi config');
        }
    });


    async function isValid(query: string): Promise<boolean> {
        const data = await request(endpoint, query);
        if (data) {
            try {
                const errorLog = JSON.stringify(data.buildConfig.errors, undefined, 2);
                channel.appendLine(errorLog);
            } catch (error) {
                channel.append(error);
            } finally {
                return data && data.buildConfig.valid;
            }
        }
        return false;
    };

	context.subscriptions.push(validateFromPalette);
}

export function deactivate() {}
