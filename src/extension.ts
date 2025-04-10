import * as vscode from 'vscode';
import ollama from 'ollama';

export function activate(context: vscode.ExtensionContext) {

	const disposable = vscode.commands.registerCommand('ChattyCoder.start', () => {
		const panel = vscode.window.createWebviewPanel(
			'chattyCoder',
			'Chatty Coder',
			vscode.ViewColumn.One,
			{ enableScripts: true }
		);

		panel.webview.html = getWebViewContent();

		panel.webview.onDidReceiveMessage(async (message: any) => {
			console.log("Received message:", message);

			if (message.command === 'ask') {
				const userPrompt = message.text;
				let responseText ='';

				try{
					const streamResponse = await ollama.chat({
						model: 'deepseek-r1:1.5b',
						messages: [{ role: 'user', content: userPrompt }],
						stream: true
					});
					for await (const part of streamResponse) {
						responseText += part.message.content;
						panel.webview.postMessage({ command: 'chatResponse', text: responseText });
					}
				} catch (error) {
					panel.webview.postMessage({ command: 'chatResponse', text: `Error: ${String(error)}` });
				}
			}
		});

	});

	context.subscriptions.push(disposable);
};

function getWebViewContent() {
	return /*html*/`
	<!DOCTYPE html>
	<html lang="en">
	<head>
		<meta charset="UTF-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<title>Chatty Coder</title>
		<style>
			:root {
				--bg-color: #1e1e1e;
				--primary:rgb(255, 91, 132);
				--text-color: #f0f0f0;
				--input-bg: #2c2c2c;
				--border-color: #3f3f3f;
			}

			body {
				margin: 0;
				padding: 1.5rem;
				background-color: var(--bg-color);
				color: var(--text-color);
				font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
			}

			h2 {
				margin-bottom: 1rem;
				color: var(--primary);
			}

			#prompt {
				width: 100%;
				padding: 0.75rem;
				background-color: var(--input-bg);
				color: var(--text-color);
				border: 1px solid var(--border-color);
				border-radius: 8px;
				font-size: 1rem;
				box-sizing: border-box;
				resize: vertical;
			}

			#askBtn {
				margin-top: 0.75rem;
				padding: 0.5rem 1rem;
				background-color: var(--primary);
				color: #fff;
				border: none;
				border-radius: 6px;
				cursor: pointer;
				transition: background 0.2s ease;
			}

			#askBtn:hover {
				background-color: #0197a7;
			}

			#response {
				margin-top: 1.5rem;
				padding: 1rem;
				background-color: #2a2a2a;
				border: 1px solid var(--border-color);
				border-radius: 8px;
				min-height: 10rem;
				white-space: pre-wrap;
				animation: fadeIn 0.3s ease-in-out;
			}

			@keyframes fadeIn {
				from { opacity: 0; }
				to { opacity: 1; }
			}
		</style>
	</head>
	<body>
		<h2>💬  Chatty Coder</h2>
		<textarea id="prompt" rows="4" placeholder="Ask me anything about code, AI, or life..."></textarea>
		<br />
		<button id="askBtn">Send</button>
		<div id="response"></div>

		<script>
			const vscode = acquireVsCodeApi();

			document.getElementById('askBtn').addEventListener('click', () => {
				const prompt = document.getElementById('prompt').value.trim();
				if (prompt) {
					vscode.postMessage({ command: 'ask', text: prompt });
					document.getElementById('response').innerHTML = 'Thinking... 🤔';
				}
			});

			window.addEventListener('message', (event) => {
				const { command, text } = event.data;
				if (command === 'chatResponse') {
					document.getElementById('response').innerHTML = text;
				}
			});
		</script>
	</body>
	</html>`;
}



export function deactivate() { }
