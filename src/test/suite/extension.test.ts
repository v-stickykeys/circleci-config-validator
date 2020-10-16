import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import * as ext from '../../extension';

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('Sample test', () => {
		assert.equal(-1, [1, 2, 3].indexOf(5));
		assert.equal(-1, [1, 2, 3].indexOf(0));
    });
    
    // test('isValid returns true when buildConfig valid is true');
    // test('isValid returns false when buildConfig valid is false');
    // test('extension displays warning when document is empty');
    // test('extension displays warning when no document is selected');
});
