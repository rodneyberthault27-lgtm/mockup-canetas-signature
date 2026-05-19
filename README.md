# Mockup de Logo em Canetas

Aplicativo estático para posicionar um logo sobre fotos reais de canetas e baixar o mockup final em PNG.

## Como usar

Hospede a pasta no GitHub Pages ou rode um servidor local na pasta do projeto. Exemplo:

```bash
python -m http.server 4173 --bind 127.0.0.1
```

Depois acesse `http://127.0.0.1:4173`.

Funcionalidades:

- escolher uma foto de caneta da galeria de produtos;
- buscar por produto, linha ou cor;
- filtrar por linha;
- filtrar rapidamente por cor da caneta;
- enviar uma foto própria da caneta;
- enviar logo em PNG, JPG, WebP ou SVG;
- arrastar o logo na prévia;
- girar a caneta;
- mostrar frente e verso da mesma caneta;
- ajustar tamanho, rotação 360, opacidade e efeito de gravação do logo;
- remover automaticamente fundo branco/claro do logo enviado;
- aplicar cor original, preta, branca, dourada, prata ou personalizada ao logo;
- ajustar o recorte da caneta para impedir que o logo apareça fora dela;
- manter o logo limitado ao formato visível da caneta;
- baixar o mockup final com apresentação Newpen Signature e dados do produto.

As imagens da galeria ficam em `assets/products`, e o catálogo fica em `products.json`.

## Publicar no GitHub Pages

1. Crie um repositório no GitHub.
2. Envie estes arquivos para o repositório.
3. Em `Settings > Pages`, escolha a branch principal e a pasta raiz.
4. Compartilhe o link gerado pelo GitHub Pages.

O GitHub Pages não cria uma área privada. Quem tiver o link consegue acessar.
