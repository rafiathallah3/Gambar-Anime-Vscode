import * as vscode from 'vscode';
import axios from 'axios';

export function activate(context: vscode.ExtensionContext) {
	let currentPanel: vscode.WebviewPanel | undefined = undefined;

	context.subscriptions.push(
		vscode.commands.registerCommand('gambarAnime.gambar', async () => {
			const columnToShowIn = vscode.window.activeTextEditor
				? vscode.window.activeTextEditor.viewColumn
				: undefined;

			if(currentPanel) {
				(currentPanel as vscode.WebviewPanel).reveal(columnToShowIn);
			} else {
				currentPanel = vscode.window.createWebviewPanel(
					'gambarAnime',
					'Gambar Anime',
					vscode.ViewColumn.One,
					{enableScripts: true}
				);
	
				let iterasi = 0;
				let tapoin = false;
				const EkstrakGambar = (gambar: {url: string}[]) => {
					let text = '';
	
					gambar.forEach((value, i) => {
						text += `<img id="gambar" class="center-fit ${(!tapoin ? (i === iterasi ? '' : 'tapoin') : 'tapoin')}" src="${value.url}" loading="lazy" onclick="KlikGambar(this)" />\n`;
					});
	
					return text;
				};
	
				const DapatinGambar = async () => {
					return await axios.get('https://api.waifu.im/search/?is_nsfw=false&limit=20').then(d => d.data);
				};
	
				//dk4r4gx6hrtjw426blzcyg4edvwk2be3n6ziqucenvq6mxjf2qra
	
				let ListGambar = await DapatinGambar() as any;
				const KirimGambar = async () => {
					currentPanel!.webview.html = `<!DOCTYPE html>
					<html lang="en">
					<head>
						<meta charset="UTF-8">
						<meta name="viewport" content="width=device-width, initial-scale=1.0">
						<title>Gambar Anime</title>
						<style>
							* {
								margin: 0;
								padding: 0;
							}
							.imgbox {
								display: grid;
								height: 100%;
							}
							.center-fit {
								max-width: 100%;
								max-height: 100vh;
								margin: auto;
							}
							.tapoin {
								display: none;
							}
						</style>
					</head>
					<body>
						<div class="imgbox">
							${EkstrakGambar(ListGambar.images)}
						</div>
						<div style="display: flex; flex-direction: row; justify-content: center;">
							<button style="margin: 10px;" onclick="Tapoin()">Hide</button>
							<button style="margin: 10px;" onclick="Skip()">Skip</button>
						</div>
						<script>
							const vscode = acquireVsCodeApi();
							let tapoin = false;
	
							function KlikGambar(element) {
								vscode.postMessage({
									command: "gambar",
									text: element.getAttribute('src')
								});
							}
	
							function Tapoin() {
								tapoin = !tapoin;
								
								if(tapoin) {
									document.getElementById("gambar").classList.add("tapoin");
								} else {
									document.getElementById("gambar").classList.remove("tapoin");
								}
								
								vscode.postMessage({
									command: "tapoin",
									text: tapoin
								});
							}

							function Skip() {
								vscode.postMessage({
									command: "skip",
									text: "skip"
								});
							}
						</script>
					</body>
					</html>`;
					iterasi++;
	
					if(iterasi > 20) {
						ListGambar = await DapatinGambar();
						iterasi = 0;
					}
				};
	
				await KirimGambar();
				await new Promise(r => setTimeout(r, 10000));
	
				currentPanel.webview.onDidReceiveMessage(async (pesan) => {
					switch (pesan.command) {
						case 'gambar':
							vscode.env.openExternal(vscode.Uri.parse(pesan.text));
							return;
						case "tapoin":
							tapoin = pesan.text;
							return;
						case "skip":
							await KirimGambar();
							return;
					}
				}, undefined, context.subscriptions);
	
				const interval = setInterval(KirimGambar, 30000);
	
				currentPanel.onDidDispose(() => {
					clearInterval(interval);
				}, null, context.subscriptions);
			}
		})
	);
}

export function deactivate() {}
