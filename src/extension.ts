import * as vscode from 'vscode';
import axios from 'axios';
import { ReadableStreamDefaultController } from 'stream/web';

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		vscode.commands.registerCommand('gambarAnime.gambar', async () => {
			const panel = vscode.window.createWebviewPanel(
				'gambarAnime',
				'Gambar Anime',
				vscode.ViewColumn.One,
				{enableScripts: true}
			);

			let iterasi = 0;
			let tapoin = false;
			const EkstrakGambar = (gambar: {url: string}[]) => {
				let text = '';
				
				console.log(gambar, " isi gamar");
				gambar.forEach((value, i) => {
					text += `<img class="center-fit anime" src="${value.url}" loading="lazy" ${(!tapoin ? (i === iterasi ? '' : 'style="display: none"') : 'style="display: none"')} onclick="KlikGambar(this)" />\n`;
				});

				return text;
			};

			const DapatinGambar = async () => {
				return await axios.get('https://api.waifu.im/random?is_nsfw=false&many=true').then(d => d.data);
			};

			//dk4r4gx6hrtjw426blzcyg4edvwk2be3n6ziqucenvq6mxjf2qra

			let ListGambar = await DapatinGambar() as any;
			const KirimGambar = async () => {
				panel.webview.html = `<!DOCTYPE html>
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
					</style>
				</head>
				<body>
					<div class="imgbox">
						${EkstrakGambar(ListGambar.images)}
					</div>
					<button onclick="Tapoin()">Tapoin</button>
					<script>
						const vscode = acquireVsCodeApi();
						let tapoin = false;

						function KlikGambar(element) {
							console.log(element.getAttribute('src'));
							vscode.postMessage({
								command: "gambar",
								text: element.getAttribute('src')
							});
						}

						function Tapoin() {
							tapoin = !tapoin;
							vscode.postMessage({
								command: "tapoin",
								text: tapoin
							})
						}
					</script>
				</body>
				</html>`;
				iterasi++;
				console.log("iterasi: ", iterasi);

				if(iterasi > 25) {
					ListGambar = await DapatinGambar();
					iterasi = 0;
				}
			};

			await KirimGambar();
			await new Promise(r => setTimeout(r, 10000));

			panel.webview.onDidReceiveMessage(async (pesan) => {
				switch (pesan.command) {
					case 'gambar':
						vscode.env.openExternal(vscode.Uri.parse(pesan.text));
						return;
					case "tapoin":
						tapoin = pesan.text;
						console.log(!tapoin);
						await KirimGambar();
						return;
				}
			}, undefined, context.subscriptions);

			setInterval(KirimGambar, 30000);
		})
	);
}

export function deactivate() {}
