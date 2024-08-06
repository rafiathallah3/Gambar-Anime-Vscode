import * as vscode from 'vscode';
import axios from 'axios';

const MaximumIterasi = 20;
const CooldownGantiGambar = 30 * 1000;
const CooldownErrorGambar = 3 * 1000;

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

	return dataGambar >= 400 ? { error: true } : {...dataGambar, error: false};
};

const EkstrakGambar = (gambar: {url: string}[]) => {
	let text = '';

	gambar.forEach((value, i) => {
		if(i < MaximumIterasi) {
			text += `<img id="gambar" class="center-fit ${(!GambarAnimePanel.tapoin ? (i === GambarAnimePanel.iterasi ? '' : 'tapoin') : 'tapoin')}" src="${value.url}" loading="lazy" onclick="KlikGambar(this)" />\n`;
		}
	});

	return text;
};

function getWebviewOptions(extensionUri: vscode.Uri): vscode.WebviewOptions {
	return {
		enableScripts: true,
		localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')]
	};
}

class GambarAnimePanel {
	public static currentPanel: GambarAnimePanel | undefined;

	public static readonly viewType = 'gambarAnime';

	public static tapoin = "";
	public static _interval: NodeJS.Timer | undefined;
	public static iterasi = 0;
	public static ListGambar: {images: {url: string}[], error: boolean} = {images: [], error: false};

	private readonly _panel: vscode.WebviewPanel;

	public static createOrShow(extension: vscode.ExtensionContext) {
		const column = vscode.window.activeTextEditor
			? vscode.window.activeTextEditor.viewColumn
			: undefined;

		if (GambarAnimePanel.currentPanel) {
			GambarAnimePanel.currentPanel._panel.reveal(column);
			return;
		}

		const panel = vscode.window.createWebviewPanel(
			GambarAnimePanel.viewType,
			'Gambar Anime',
			column || vscode.ViewColumn.One,
			getWebviewOptions(extension.extensionUri),
		);

		GambarAnimePanel.currentPanel = new GambarAnimePanel(panel, extension);
	}

	public static revive(panel: vscode.WebviewPanel, extension: vscode.ExtensionContext) {
		GambarAnimePanel.currentPanel = new GambarAnimePanel(panel, extension);
	}

	private constructor(panel: vscode.WebviewPanel, extension: vscode.ExtensionContext) {
		this._panel = panel;

		this._panel.onDidDispose(() => this.dispose(), null, extension.subscriptions);

		this._panel.webview.onDidReceiveMessage(async (pesan) => {
			switch (pesan.command) {
				case 'gambar':
					vscode.env.openExternal(vscode.Uri.parse(pesan.text));
					return;
				case "tapoin":
					GambarAnimePanel.tapoin = pesan.text;
					return;
				case "skip":
					clearInterval(GambarAnimePanel._interval);
					GambarAnimePanel._interval = setInterval(GambarAnimePanel.updateHTML, GambarAnimePanel.ListGambar.error ? CooldownErrorGambar : CooldownGantiGambar);
					await GambarAnimePanel.updateHTML();

					return;
			}
		}, undefined, extension.subscriptions);

		this.InitializeClass();
	}

	public dispose() {
		GambarAnimePanel.currentPanel = undefined;
		clearInterval(GambarAnimePanel._interval);
	}

	public async InitializeClass() {
		GambarAnimePanel.ListGambar = await DapatinGambar();

		GambarAnimePanel._interval = setInterval(GambarAnimePanel.updateHTML, GambarAnimePanel.ListGambar.error ? CooldownErrorGambar : CooldownGantiGambar);

		await GambarAnimePanel.updateHTML();
	}

	private static async updateHTML() {
		console.log("UPDATE!", GambarAnimePanel.iterasi, GambarAnimePanel.ListGambar);
		if(GambarAnimePanel.currentPanel === undefined) {
			return;
		}

		GambarAnimePanel.currentPanel._panel.webview.html = `<!DOCTYPE html>
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
					${(!GambarAnimePanel.ListGambar.error ? EkstrakGambar(GambarAnimePanel.ListGambar.images) : '<h3 style="text-align: center;">API Error, Retrying...</h3>')}
				</div>
				<div style="display: flex; flex-direction: row; justify-content: center;">
					${(!GambarAnimePanel.ListGambar.error ? `
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

		GambarAnimePanel.iterasi++;
	
		if(GambarAnimePanel.iterasi > MaximumIterasi || GambarAnimePanel.ListGambar.error) {
			GambarAnimePanel.ListGambar = await DapatinGambar();
			GambarAnimePanel.iterasi = 0;

			clearInterval(GambarAnimePanel._interval);
			GambarAnimePanel._interval = setInterval(GambarAnimePanel.updateHTML, GambarAnimePanel.ListGambar.error ? CooldownErrorGambar : CooldownGantiGambar);
			await GambarAnimePanel.updateHTML();
		}
	}
}

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		vscode.commands.registerCommand('gambarAnime.gambar', async () => {
			GambarAnimePanel.createOrShow(context);
		})
	);

	if (vscode.window.registerWebviewPanelSerializer) {
		vscode.window.registerWebviewPanelSerializer('gambarAnime', {
			async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, state: any) {
				webviewPanel.webview.options = getWebviewOptions(context.extensionUri);
				GambarAnimePanel.revive(webviewPanel, context);
			}
		});
	}
}

export function deactivate() {}
