import * as vscode from 'vscode';
import axios from 'axios';

const MaximumIterasi = 20;

let StatusWeb = 1;
const DapatinGambar = async () => {
	StatusWeb = (StatusWeb + 1) % 2;

	let dataGambar;
	if(StatusWeb === 0) {
		dataGambar = await axios.get('https://api.waifu.im/search/?is_nsfw=false&limit=20').then(d => d.data).catch((r) => parseInt(r.response.status));
	} else {
		dataGambar = await axios.post("https://api.waifu.pics/many/sfw/waifu", {}).then(d => d.data).catch((r) => parseInt(r.response.status)) as { files: string[], images: {url: string}[] };
		if(typeof(dataGambar) !== "number") {
			dataGambar.images = dataGambar.files.map(d => ({ url: d }));
		}
	}

	return dataGambar >= 400 ? "Error" : dataGambar;
};

export function activate(context: vscode.ExtensionContext) {
	let currentPanel: vscode.WebviewPanel | undefined = undefined;

	context.subscriptions.push(
		vscode.commands.registerCommand('gambarAnime.gambar', async () => {
			const columnToShowIn = vscode.window.activeTextEditor
				? vscode.window.activeTextEditor.viewColumn
				: undefined;

			if(currentPanel) {
				currentPanel.reveal(columnToShowIn);
			} else {
				currentPanel = vscode.window.createWebviewPanel(
					'gambarAnime',
					'Gambar Anime',
					columnToShowIn || vscode.ViewColumn.One,
					{enableScripts: true}
				);

				currentPanel.webview.onDidReceiveMessage(async (pesan) => {
					switch (pesan.command) {
						case 'gambar':
							vscode.env.openExternal(vscode.Uri.parse(pesan.text));
							return;
						case "tapoin":
							tapoin = pesan.text;
							return;
						case "skip":
							clearInterval(interval);
							interval = setInterval(KirimGambar, ListGambar === "Error" ? 3000 : 30000);
							await KirimGambar();

							return;
					}
				}, undefined, context.subscriptions);
		
				currentPanel.onDidDispose(() => {
					currentPanel = undefined;
					clearInterval(interval);
				}, null, context.subscriptions);
	
				let iterasi = 0;
				let tapoin = false;
				const EkstrakGambar = (gambar: {url: string}[]) => {
					let text = '';
	
					gambar.forEach((value, i) => {
						if(i < MaximumIterasi) {
							text += `<img id="gambar" class="center-fit ${(!tapoin ? (i === iterasi ? '' : 'tapoin') : 'tapoin')}" src="${value.url}" loading="lazy" onclick="KlikGambar(this)" />\n`;
						}
					});
	
					return text;
				};
	
				//dk4r4gx6hrtjw426blzcyg4edvwk2be3n6ziqucenvq6mxjf2qra
	
				let ListGambar = await DapatinGambar() as any;
				var interval: NodeJS.Timer;
				
				const KirimGambar = async () => {
					if(currentPanel !== undefined) {
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
								${(ListGambar !== "Error" ? EkstrakGambar(ListGambar.images) : '<h3 style="text-align: center;">API Error, Retrying...</h3>')}
							</div>
							<div style="display: flex; flex-direction: row; justify-content: center;">
								${(ListGambar !== "Error" ? `
									<button style="margin: 10px;" onclick="Tapoin()">Hide</button>
									<button style="margin: 10px;" onclick="Skip()">Skip</button>` 
									: "" )}
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
		
						if(iterasi > MaximumIterasi || ListGambar === "Error") {
							ListGambar = await DapatinGambar();
							iterasi = 0;
	
							clearInterval(interval);
							interval = setInterval(KirimGambar, ListGambar === "Error" ? 3000 : 30000);
							await KirimGambar();
						}
					}
				};
	
				interval = setInterval(KirimGambar, ListGambar === "Error" ? 3000 : 30000);

				await KirimGambar();
				// await new Promise(r => setTimeout(r, 30000)); // What the hell is this for???
			}
		})
	);
}

export function deactivate() {}
