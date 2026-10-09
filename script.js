/* PASSAGEIROS
   0. a sanfona do menu no celular
   1. a régua de progresso com a locomotiva
   2. os blocos que sobem ao entrar em cena
   3. o anúncio do condutor, digitado
   4. o canhoto do bilhete que se destaca
   5. as epígrafes do Ato 1 se revezando
   6. o placar de dobrar da contagem, e a contagem no título da aba */
(function () {
  'use strict';

  var semMovimento = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var temObservador = 'IntersectionObserver' in window;

  /* =============== 0. sanfona do celular =============== */
  var topo = document.querySelector('.topo');
  var botaoMenu = document.getElementById('menu-botao');

  if (topo && botaoMenu) {
    var fecharMenu = function () {
      topo.classList.remove('menu-aberto');
      botaoMenu.setAttribute('aria-expanded', 'false');
      botaoMenu.setAttribute('aria-label', 'Abrir menu');
    };

    botaoMenu.addEventListener('click', function () {
      var aberto = topo.classList.toggle('menu-aberto');
      botaoMenu.setAttribute('aria-expanded', aberto ? 'true' : 'false');
      botaoMenu.setAttribute('aria-label', aberto ? 'Fechar menu' : 'Abrir menu');
    });

    /* escolher uma seção fecha a sanfona */
    Array.prototype.forEach.call(
      document.querySelectorAll('.menu a'),
      function (a) { a.addEventListener('click', fecharMenu); }
    );

    /* Esc fecha, e voltar para a largura de computador também */
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') fecharMenu();
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 940) fecharMenu();
    });
  }

  /* =============== 1. régua de progresso =============== */
  var barra = document.getElementById('progresso');
  if (barra) {
    var pararChacoalho = null;

    var atualizar = function () {
      var altura = document.documentElement.scrollHeight - window.innerHeight;
      var pct = altura > 0 ? (window.scrollY / altura) * 100 : 0;
      barra.style.width = Math.min(100, Math.max(0, pct)).toFixed(2) + '%';
    };

    var agendado = false;
    window.addEventListener('scroll', function () {
      if (!agendado) {
        agendado = true;
        requestAnimationFrame(function () { agendado = false; atualizar(); });
      }
      barra.classList.add('andando');
      clearTimeout(pararChacoalho);
      pararChacoalho = setTimeout(function () {
        barra.classList.remove('andando');
      }, 160);
    }, { passive: true });

    window.addEventListener('resize', atualizar);
    atualizar();
  }

  /* =============== 2. revelação ao rolar =============== */
  function revelar(seletor, escalonar) {
    var itens = Array.prototype.slice.call(document.querySelectorAll(seletor));
    itens.forEach(function (el, i) {
      el.classList.add('revela');
      if (escalonar) {
        el.style.transitionDelay = Math.min(i * 70, 420) + 'ms';
      }
    });
    return itens;
  }

  if (temObservador && !semMovimento) {
    var alvos = []
      .concat(revelar('.cabeca-secao'))
      .concat(revelar('.secao .col-texto'))
      .concat(revelar('.secao .col-arte'))
      .concat(revelar('.contagem-rotulo'))
      .concat(revelar('.relogio'))
      .concat(revelar('.anuncio-in'))
      .concat(revelar('.info-grade > div', true))
      .concat(revelar('.cartao-social .social', true));

    var olho = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('visivel');
        olho.unobserve(e.target);
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' });

    alvos.forEach(function (el) { olho.observe(el); });
  }

  /* =============== 3. anúncio do condutor =============== */
  var saida = document.querySelector('.anuncio-saida');
  if (saida) {
    var fala = saida.getAttribute('data-texto') || '';

    var digitar = function () {
      var i = 0;
      var t = setInterval(function () {
        saida.textContent = fala.slice(0, ++i);
        if (i >= fala.length) clearInterval(t);
      }, 26);
    };

    if (semMovimento || !temObservador) {
      saida.textContent = fala;
    } else {
      var obsFala = new IntersectionObserver(function (entradas) {
        entradas.forEach(function (e) {
          if (!e.isIntersecting) return;
          obsFala.disconnect();
          digitar();
        });
      }, { threshold: 0.6 });
      obsFala.observe(saida);
    }
  }

  /* =============== 4. o canhoto se destaca =============== */
  var bilhete = document.querySelector('.bilhete');
  if (bilhete) {
    if (semMovimento || !temObservador) {
      bilhete.classList.add('destacado');
    } else {
      var obsBilhete = new IntersectionObserver(function (entradas) {
        entradas.forEach(function (e) {
          if (!e.isIntersecting) return;
          obsBilhete.disconnect();
          setTimeout(function () { bilhete.classList.add('destacado'); }, 550);
        });
      }, { threshold: 0.45 });
      obsBilhete.observe(bilhete);
    }
  }

  /* =============== 5. epígrafes do Ato 1 =============== */
  var epigrafes = Array.prototype.slice.call(document.querySelectorAll('.epigrafe'));
  if (epigrafes.length > 1 && !semMovimento) {
    var atual = 0;
    var girando = null;

    var proxima = function () {
      epigrafes[atual].classList.remove('ativa');
      atual = (atual + 1) % epigrafes.length;
      epigrafes[atual].classList.add('ativa');
    };

    var ligar = function () {
      if (!girando) girando = setInterval(proxima, 7500);
    };
    var desligar = function () {
      clearInterval(girando);
      girando = null;
    };

    if (temObservador) {
      var obsEpi = new IntersectionObserver(function (entradas) {
        entradas.forEach(function (e) {
          if (e.isIntersecting) ligar(); else desligar();
        });
      }, { threshold: 0.3 });
      obsEpi.observe(document.getElementById('epigrafes'));
    } else {
      ligar();
    }
  }

  /* =============== 6. contagem regressiva =============== *
     Horário ainda a confirmar; o relógio aponta para o começo do dia
     em Brasília (UTC-3). Ajuste a linha abaixo quando a hora for definida. */
  var EMBARQUE = new Date('2026-11-07T00:00:00-03:00').getTime();

  var relogio = document.getElementById('relogio');
  if (!relogio) return;

  var legenda = document.getElementById('contagem-texto');
  var tituloOriginal = document.title;
  var diasRestantes = null;

  /* cada ficha do placar */
  var fichas = {};
  Array.prototype.forEach.call(relogio.querySelectorAll('.flip'), function (el) {
    fichas[el.getAttribute('data-rel')] = {
      raiz:  el,
      topo:  el.querySelector('.meia.topo span'),
      base:  el.querySelector('.meia.base span'),
      baixo: el.querySelector('.folha.baixo .face span'),
      cima:  el.querySelector('.folha.cima .face span'),
      valor: null,
      timer: null
    };
  });

  /* Em repouso quem aparece é a metade de cima parada e a aba de baixo,
     então as quatro faces precisam terminar com o mesmo número. */
  function assentar(ficha, v) {
    ficha.topo.textContent = v;
    ficha.base.textContent = v;
    ficha.baixo.textContent = v;
    ficha.cima.textContent = v;
  }

  /* Vira a ficha: a aba de baixo levanta levando o número velho e
     descobre o novo embaixo; depois a aba de cima assenta com o número
     novo sobre o velho. A parte de cima é a última a mudar. */
  function virar(ficha, novo) {
    if (!ficha || ficha.valor === novo) return;

    var antigo = ficha.valor === null ? novo : ficha.valor;
    ficha.valor = novo;

    if (semMovimento || antigo === novo) {
      assentar(ficha, novo);
      return;
    }

    ficha.topo.textContent = antigo;   /* parado: segura o número velho  */
    ficha.base.textContent = novo;     /* parado: já espera o novo        */
    ficha.baixo.textContent = antigo;  /* aba que levanta: número velho   */
    ficha.cima.textContent = novo;     /* aba que assenta: número novo    */

    ficha.raiz.classList.remove('virando');
    void ficha.raiz.offsetWidth;       /* reinicia a animação */
    ficha.raiz.classList.add('virando');

    clearTimeout(ficha.timer);
    ficha.timer = setTimeout(function () {
      assentar(ficha, novo);
      ficha.raiz.classList.remove('virando');
    }, 540);
  }

  var id = null;

  function dois(n) { return (n < 10 ? '0' : '') + n; }

  function tique() {
    var falta = EMBARQUE - Date.now();

    if (falta <= 0) {
      if (id) { clearInterval(id); id = null; }
      diasRestantes = 0;
      relogio.classList.add('chegou');
      relogio.innerHTML =
        '<div class="aviso"><strong>Hoje</strong><span>o trem parte</span></div>';
      if (legenda) legenda.textContent = 'É hoje: o trem parte.';
      return;
    }

    var seg = Math.floor(falta / 1000);
    var dias = Math.floor(seg / 86400);
    var horas = Math.floor((seg % 86400) / 3600);
    var min = Math.floor((seg % 3600) / 60);

    diasRestantes = dias;

    virar(fichas.dias, String(dias));
    virar(fichas.horas, dois(horas));
    virar(fichas.min, dois(min));
    virar(fichas.seg, dois(seg % 60));

    if (legenda) {
      legenda.textContent = 'Faltam ' + dias + ' dias e ' + horas +
        ' horas para 07 de novembro de 2026.';
    }
  }

  tique();
  id = setInterval(tique, 1000);

  /* a aba em segundo plano passa a mostrar quanto falta */
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden || diasRestantes === null) {
      document.title = tituloOriginal;
      return;
    }
    document.title = diasRestantes === 0
      ? 'É hoje · Passageiros'
      : diasRestantes + (diasRestantes === 1 ? ' dia' : ' dias') + ' · Passageiros';
  });
})();
