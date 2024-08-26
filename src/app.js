import express from 'express';
import fs from 'fs';
import path from 'path';
import extrairCapaPDF from './extraiCapa.js';
import zlib from 'zlib';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3010;
const diretorioBase = process.env.DIR_BASE;

app.use(cors());

function geraLinkDeDownload(host, tipo, nomeArquivo) {
  return `http://${host}/downloads/${tipo}/${nomeArquivo}`;
}

app.get('/treinamentos/:tipo', async(req, res) => {
  const { tipo } = req.params;
  const host = req.headers.host;
  const diretorioTipo = path.join(diretorioBase, tipo);

  try {
    if (!fs.existsSync(diretorioTipo) || !fs.lstatSync(diretorioTipo).isDirectory()) {
      return res.status(404).json({ erro: 'Tipo de treinamento não encontrado.' });
    }

    const arquivos = fs.readdirSync(diretorioTipo);
    const listaArquivos = [];

    for (const nomeArquivo of arquivos) {
      const caminhoArquivo = path.join(diretorioTipo, nomeArquivo);

      if (path.extname(nomeArquivo) === '.pdf') {
        const linkDownload = geraLinkDeDownload(host, tipo, nomeArquivo);
        const capaBytes = await extrairCapaPDF(caminhoArquivo);

        const capaBytesComprimidos = await compactarBytes(capaBytes);

        listaArquivos.push({
          nome: nomeArquivo,
          link: linkDownload,
          bytes: Array.from(capaBytesComprimidos),
        });
      }
    }

    const resultado = {};
    resultado[tipo] = listaArquivos;

    res.json(resultado);
  } catch (erro) {
    res.status(500).json({ erro: `Erro ao ler o diretório ou processar os arquivos: ${erro}`});
  }
});

app.get('/downloads/:tipo/:arquivo', (req, res) => {
  const { tipo, arquivo } = req.params;
  const caminhoArquivo = path.join(diretorioBase, tipo, arquivo);

  res.download(caminhoArquivo, erro => {
    if (erro) {
      res.status(500).json({ erro: 'Erro ao fazer o download do arquivo' });
    }
  });
});

async function compactarBytes(bytes) {
  return new Promise((resolve, reject) => {
    zlib.gzip(bytes, (erro, resultado) => {
      if (erro) {
        reject(erro);
      } else {
        resolve(resultado);
      }
    });
  });
}

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
