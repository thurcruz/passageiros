/* PASSAGEIROS — três comportamentos: a régua amarela de progresso,
   a contagem regressiva até o embarque e a arte 1080x1920 de compartilhamento. */
(function () {
  'use strict';

  /* ---- régua de progresso ---- */
  var barra = document.getElementById('progresso');
  if (barra) {
    var atualizar = function () {
      var altura = document.documentElement.scrollHeight - window.innerHeight;
      var pct = altura > 0 ? (window.scrollY / altura) * 100 : 0;
      barra.style.width = Math.min(100, Math.max(0, pct)).toFixed(2) + '%';
    };
    var agendado = false;
    window.addEventListener('scroll', function () {
      if (agendado) return;
      agendado = true;
      requestAnimationFrame(function () { agendado = false; atualizar(); });
    }, { passive: true });
    window.addEventListener('resize', atualizar);
    atualizar();
  }

  /* =========================================================
     ARTE PARA STORIES — 1080 x 1920
     Desenhada no canvas com o logotipo do espetáculo. Vai para o
     menu de compartilhamento do aparelho; onde ele não existe,
     baixa como PNG.
     ========================================================= */
  var LARGURA = 1080, ALTURA = 1920, MEIO = LARGURA / 2;

  var VINHO = '#3f0c0f',
      AMARELO = '#ffc800',
      CREME = '#f6ead6',
      CREME_MID = 'rgba(246,234,214,.72)';

  function escreve(ctx, texto, opc) {
    ctx.save();
    ctx.font = opc.fonte;
    ctx.fillStyle = opc.cor;
    ctx.textAlign = opc.alinha || 'center';
    ctx.textBaseline = 'alphabetic';
    if ('letterSpacing' in ctx && opc.esp) ctx.letterSpacing = opc.esp;
    ctx.fillText(texto, opc.x === undefined ? MEIO : opc.x, opc.y);
    ctx.restore();
  }

  function desenharArte(logo) {
    var c = document.createElement('canvas');
    c.width = LARGURA;
    c.height = ALTURA;
    var ctx = c.getContext('2d');

    /* fundo */
    ctx.fillStyle = VINHO;
    ctx.fillRect(0, 0, LARGURA, ALTURA);

    /* moldura fina */
    ctx.strokeStyle = 'rgba(255,200,0,.45)';
    ctx.lineWidth = 3;
    ctx.strokeRect(52, 52, LARGURA - 104, ALTURA - 104);

    /* cartola */
    escreve(ctx, 'TEATRO RECARGA APRESENTA', {
      fonte: '600 30px Inter, sans-serif', cor: AMARELO, esp: '8px', y: 300
    });

    /* logotipo */
    var lw = 820, lh = lw * (logo.naturalHeight / logo.naturalWidth);
    ctx.drawImage(logo, MEIO - lw / 2, 360, lw, lh);

    var y = 360 + lh;

    /* chamada */
    escreve(ctx, 'Ninguém desce do mesmo', {
      fonte: 'italic 400 62px "Instrument Serif", Georgia, serif', cor: CREME, y: y + 140
    });
    escreve(ctx, 'jeito que entrou.', {
      fonte: 'italic 400 62px "Instrument Serif", Georgia, serif', cor: CREME, y: y + 212
    });

    /* fio */
    ctx.strokeStyle = 'rgba(255,200,0,.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(MEIO - 170, y + 300);
    ctx.lineTo(MEIO + 170, y + 300);
    ctx.stroke();

    /* data */
    escreve(ctx, '07.11.2026', {
      fonte: '800 142px Inter, sans-serif', cor: AMARELO, esp: '-4px', y: y + 440
    });
    escreve(ctx, 'SÁBADO', {
      fonte: '600 30px Inter, sans-serif', cor: CREME_MID, esp: '10px', y: y + 500
    });

    /* local */
    escreve(ctx, 'Igreja Batista Central de Campo Grande', {
      fonte: '600 36px Inter, sans-serif', cor: CREME, y: y + 630
    });
    escreve(ctx, 'Rua União da Vitória, 564', {
      fonte: '400 32px Inter, sans-serif', cor: CREME_MID, y: y + 684
    });

    /* faixa do ingresso */
    var faixaY = ALTURA - 400;
    ctx.fillStyle = AMARELO;
    ctx.fillRect(110, faixaY, LARGURA - 220, 170);
    escreve(ctx, 'ENTRADA', {
      fonte: '600 26px Inter, sans-serif', cor: VINHO, esp: '9px', y: faixaY + 62
    });
    escreve(ctx, '1 KG DE ALIMENTO NÃO PERECÍVEL', {
      fonte: '800 38px Inter, sans-serif', cor: VINHO, esp: '-1px', y: faixaY + 122
    });

    /* assinatura */
    escreve(ctx, '@recargaoficial', {
      fonte: '500 30px Inter, sans-serif', cor: AMARELO, y: ALTURA - 150
    });

    return c;
  }

  function prontoParaDesenhar() {
    var fontes = (document.fonts && document.fonts.ready)
      ? document.fonts.ready
      : Promise.resolve();

    var imagem = new Promise(function (ok, erro) {
      var img = new Image();
      img.onload = function () { ok(img); };
      img.onerror = function () { erro(new Error('logotipo')); };
      img.src = 'img/PASSAGEIROS_LOGOTIPO.png';
    });

    return Promise.all([fontes, imagem]).then(function (r) { return r[1]; });
  }

  function paraBlob(canvas) {
    return new Promise(function (ok, erro) {
      canvas.toBlob(function (b) {
        if (b) ok(b); else erro(new Error('blob'));
      }, 'image/png');
    });
  }

  var botao = document.getElementById('compartilhar');
  if (botao) {
    var rotulo = document.getElementById('compartilhar-texto');
    var nota = document.getElementById('compartilhar-nota');
    var original = rotulo ? rotulo.textContent : '';
    var notaOriginal = nota ? nota.textContent : '';

    var avisar = function (msg, msgNota) {
      if (rotulo) rotulo.textContent = msg;
      if (nota && msgNota) nota.textContent = msgNota;
      setTimeout(function () {
        if (rotulo) rotulo.textContent = original;
        if (nota) nota.textContent = notaOriginal;
      }, 3200);
    };

    botao.addEventListener('click', function () {
      botao.disabled = true;
      if (rotulo) rotulo.textContent = 'Gerando...';

      prontoParaDesenhar()
        .then(function (logo) { return paraBlob(desenharArte(logo)); })
        .then(function (blob) {
          var arquivo = new File([blob], 'passageiros-07-11-2026.png', { type: 'image/png' });

          if (navigator.canShare && navigator.canShare({ files: [arquivo] })) {
            return navigator.share({
              files: [arquivo],
              title: 'Passageiros — Teatro Recarga',
              text: '07 de novembro de 2026. Entrada: 1 kg de alimento não perecível.'
            }).then(function () {
              botao.disabled = false;
              if (rotulo) rotulo.textContent = original;
            }, function () {
              /* o usuário fechou a folha de compartilhamento */
              botao.disabled = false;
              if (rotulo) rotulo.textContent = original;
            });
          }

          var url = URL.createObjectURL(blob);
          var a = document.createElement('a');
          a.href = url;
          a.download = 'passageiros-07-11-2026.png';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(function () { URL.revokeObjectURL(url); }, 4000);

          botao.disabled = false;
          avisar('Imagem baixada', 'A arte 1080×1920 foi salva no seu dispositivo.');
        })
        .catch(function () {
          botao.disabled = false;
          avisar('Não consegui gerar', 'Abra a página por um servidor (http) para gerar a arte.');
        });
    });
  }

  /* ---- contagem regressiva: 07 de novembro de 2026 ----
     Horário ainda a confirmar; o relógio aponta para o começo do dia
     em Brasília (UTC-3). Ajuste a linha abaixo quando a hora for definida. */
  var EMBARQUE = new Date('2026-11-07T00:00:00-03:00').getTime();

  var relogio = document.getElementById('relogio');
  if (!relogio) return;

  var campos = {
    dias:  relogio.querySelector('[data-rel="dias"]'),
    horas: relogio.querySelector('[data-rel="horas"]'),
    min:   relogio.querySelector('[data-rel="min"]'),
    seg:   relogio.querySelector('[data-rel="seg"]')
  };

  var id = null;

  function dois(n) { return (n < 10 ? '0' : '') + n; }

  function tique() {
    var falta = EMBARQUE - Date.now();

    if (falta <= 0) {
      if (id) { clearInterval(id); id = null; }
      relogio.classList.add('chegou');
      relogio.innerHTML =
        '<div><span class="num dado">Hoje</span>' +
        '<span class="un">o trem parte</span></div>';
      return;
    }

    var seg = Math.floor(falta / 1000);
    var dias = Math.floor(seg / 86400);
    var horas = Math.floor((seg % 86400) / 3600);
    var min = Math.floor((seg % 3600) / 60);
    var s = seg % 60;

    campos.dias.textContent = dias;
    campos.horas.textContent = dois(horas);
    campos.min.textContent = dois(min);
    campos.seg.textContent = dois(s);
  }

  tique();
  if (relogio.querySelector('[data-rel="seg"]')) {
    id = setInterval(tique, 1000);
  }
})();
