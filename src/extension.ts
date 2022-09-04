import * as vscode from 'vscode';
import axios from 'axios';

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		vscode.commands.registerCommand('gambarAnime.gambar', async () => {
			const panel = vscode.window.createWebviewPanel(
				'gambarAnime',
				'Gambar Anime',
				vscode.ViewColumn.One,
				{}
			);

			let iterasi = 0;
			const EkstrakGambar = (gambar: {url: string}[]) => {
				let text = '';
				
				console.log(gambar, " isi gamar");
				gambar.forEach((value, i) => {
					text += `<img class="center-fit" src="${value.url}" loading="lazy" ${(i === iterasi ? '' : 'style="display: none"')} />\n`;
				});

				return text;
			};

			const DapatinGambar = async () => {
				return await axios.get('https://api.waifu.im/random?is_nsfw=false&many=true').then(d => d.data);
			};

			let ListGambar = await DapatinGambar() as any;
			const KirimGambar = async () => {
				panel.webview.html = `<!DOCTYPE html>
				<html lang="en">
				<head>
					<meta charset="UTF-8">
					<meta name="viewport" content="width=device-width, initial-scale=1.0">
					<title>Gambar Anime</title>
					<style>
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
				</body>
				</html>`;
				iterasi++;
				console.log("iterasi: ", iterasi);

				if(iterasi > 5) {
					ListGambar = await DapatinGambar();
					iterasi = 0;
				}
			};

			await KirimGambar();
			console.log("Tunggu 10 detik");
			await new Promise(r => setTimeout(r, 10000));
			console.log("Sudah tunggu!");

			setInterval(KirimGambar, 30000);
		})
	);
}

export function deactivate() {}
