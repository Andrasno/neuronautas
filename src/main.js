/**
 * NeuroPet — Meu Primeiro Treinador de IAs (Spec2)
 * Entry point. Module hub + all 5 modules.
 */
import { createElement, clearElement } from './utils/dom.js';
import NeuroPetController from './ui/NeuroPetController.js';
import AudioManager from './engines/AudioManager.js';

const app = document.getElementById('app');
const audio = new AudioManager();
let neuroPet = null;
let stickersEarned = [];

/* ================================================================
   DATA
   ================================================================ */

const MODULES = [
  { id: 'aprendiz',  icon: '🧪', title: 'Aprendiz',   desc: 'Ensine frutas ao NeuroPet',     sticker: '🔍' },
  { id: 'logico',    icon: '🧩', title: 'Lógico',     desc: 'Regras SE… ENTÃO…',             sticker: '⚙️' },
  { id: 'programador', icon: '🤖', title: 'Programador', desc: 'Monte sequências de comandos', sticker: '📋' },
  { id: 'cidadao',   icon: '🔐', title: 'Cidadão',    desc: 'O que pode compartilhar?',      sticker: '🛡️' },
  { id: 'espelho',   icon: '🪞', title: 'Espelho',    desc: 'Nem todo mundo é igual',        sticker: '🌈' },
];

const FRUITS = [
  { id:'maca', name:'Maçã', emoji:'🍎', color:'vermelho' },
  { id:'morango', name:'Morango', emoji:'🍓', color:'vermelho' },
  { id:'cereja', name:'Cereja', emoji:'🍒', color:'vermelho' },
  { id:'banana', name:'Banana', emoji:'🍌', color:'amarelo' },
  { id:'uva', name:'Uva', emoji:'🍇', color:'roxo' },
  { id:'laranja', name:'Laranja', emoji:'🍊', color:'laranja' },
  { id:'melancia', name:'Melancia', emoji:'🍉', color:'verde' },
  { id:'kiwi', name:'Kiwi', emoji:'🥝', color:'marrom' },
];

const DISTRACTORS = [
  { id:'caminhao', name:'Caminhão', emoji:'🚛', color:'vermelho' },
  { id:'bola', name:'Bola', emoji:'⚽', color:'preto' },
  { id:'urso', name:'Ursinho', emoji:'🧸', color:'marrom' },
  { id:'lapis', name:'Lápis', emoji:'✏️', color:'amarelo' },
];

// For Module 1: only show red fruits + distractors for phase 1 training
const TRAINING_ITEMS_PHASE1 = [
  ...FRUITS.filter(f => f.color === 'vermelho'),
  ...DISTRACTORS,
];

const HYPOTHESES = [
  { id:'h1', text:'Ele vai aprender que todas as frutas são vermelhas', correct:true },
  { id:'h2', text:'Ele vai aprender que frutas podem ser de várias cores', correct:false },
  { id:'h3', text:'Ele vai achar que caminhão é fruta', correct:false },
];

/* ================================================================
   MODULE HUB
   ================================================================ */

function renderHub() {
  clearElement(app);
  neuroPet = new NeuroPetController(app);
  neuroPet.setState('sleeping');

  const zone = createElement('div', { className: 'neuropet-zone' }, neuroPet.el);
  const title = createElement('h1', {}, '🧪 NeuroPet');
  const subtitle = createElement('p', { style: 'font-size:var(--text-md);color:var(--color-text-muted);text-align:center;' },
    'Meu Primeiro Treinador de IAs');

  const grid = createElement('div', { className: 'module-grid' });

  MODULES.forEach(m => {
    const done = stickersEarned.includes(m.id);
    const card = createElement('div', {
      className: `module-card${done ? ' completed' : ''}`,
      onClick: () => openModule(m.id)
    },
      createElement('span', { className: 'module-card__icon' }, m.icon),
      createElement('div', { className: 'module-card__info' },
        createElement('span', { className: 'module-card__title' }, m.title),
        createElement('span', { className: 'module-card__desc' }, m.desc),
        done ? createElement('span', { className: 'module-card__badge' }, '✅ Completo') : null
      )
    );
    grid.appendChild(card);
  });

  // Sticker album
  const albumTitle = createElement('p', {
    style: 'font-family:var(--font-display);font-weight:700;margin-top:var(--spacing-md);'
  }, '📔 Álbum de Adesivos');
  const album = createElement('div', { className: 'sticker-album' });
  MODULES.forEach(m => {
    const earned = stickersEarned.includes(m.id);
    album.appendChild(createElement('div', {
      className: `sticker${earned ? ' earned' : ''}`
    }, earned ? m.sticker : '❓'));
  });

  const hub = createElement('div', { className: 'module-hub' },
    zone, title, subtitle, grid, albumTitle, album
  );
  app.appendChild(hub);
}

function openModule(id) {
  switch (id) {
    case 'aprendiz': renderModule1_Hypothesis(); break;
    case 'logico': renderModule2_Intro(); break;
    case 'programador': renderModule3_Intro(); break;
    case 'cidadao': renderModule4_Intro(); break;
    case 'espelho': renderModule5_Intro(); break;
  }
}

/* ================================================================
   MODULE 1: APRENDIZ (Viés de dados)
   Cycle: Hypothesis → Train → Result → Correction → Uncertainty
   ================================================================ */

let m1_hypothesisId = null;
let m1_errors = 0;

function renderModule1_Hypothesis() {
  clearElement(app);
  neuroPet = new NeuroPetController(app);
  neuroPet.setState('curious');

  const zone = createElement('div', { className: 'neuropet-zone' },
    neuroPet.el,
    createElement('div', { className: 'speech-bubble visible' },
      'Olá! Eu sou o NeuroPet. Me ajuda a aprender o que é uma FRUTA?')
  );

  const prompt = createElement('p', { className: 'hypothesis-prompt' },
    '🤔 O que você ACHA que o NeuroPet vai aprender?');

  const opts = createElement('div', { className: 'hypothesis-options' });
  HYPOTHESES.forEach(h => {
    opts.appendChild(createElement('button', {
      className: 'hypothesis-btn',
      onClick: () => { m1_hypothesisId = h.id; renderModule1_Train(); }
    },
      createElement('span', {}, h.id === 'h1' ? '🔴' : h.id === 'h2' ? '🌈' : '🚛'),
      createElement('span', {}, h.text)
    ));
  });

  const container = createElement('div', { className: 'hypothesis-screen' },
    zone, prompt, opts
  );
  app.appendChild(container);
}

function renderModule1_Train() {
  clearElement(app);
  neuroPet = new NeuroPetController(app);
  neuroPet.setState('curious');
  m1_errors = 0;

  const items = [...TRAINING_ITEMS_PHASE1];
  let trayItems = [...items];
  let droppedFruits = [];
  let droppedWrong = [];

  const zone = createElement('div', { className: 'neuropet-zone' },
    neuroPet.el,
    createElement('div', { className: 'speech-bubble visible', id:'m1-bubble' },
      'Arraste as FRUTAS para o pote verde, e o que NÃO É fruta para o pote vermelho!')
  );

  const pilesRow = createElement('div', { className: 'piles-row' });

  const yesPile = createElement('div', { className: 'drop-pile', id:'yes-pile' },
    createElement('span', { className: 'drop-pile__label' }, '✅ É FRUTA'),
    createElement('div', { className: 'drop-pile__items', id:'yes-items' })
  );

  const noPile = createElement('div', { className: 'drop-pile', id:'no-pile' },
    createElement('span', { className: 'drop-pile__label' }, '❌ NÃO é fruta'),
    createElement('div', { className: 'drop-pile__items', id:'no-items' })
  );

  pilesRow.appendChild(yesPile);
  pilesRow.appendChild(noPile);

  const tray = createElement('div', { className: 'item-tray', id:'m1-tray' });

  function renderTray() {
    clearElement(tray);
    trayItems.forEach(item => {
      const used = droppedFruits.concat(droppedWrong).find(d => d.id === item.id);
      const card = createElement('div', {
        className: `item-card${used ? ' item-card--used' : ''}`,
        id: `item-${item.id}`,
        draggable: used ? 'false' : 'true'
      },
        createElement('span', { className: 'item-card__emoji' }, item.emoji),
        createElement('span', { className: 'item-card__label' }, item.name)
      );

      if (!used) {
        card.addEventListener('dragstart', e => {
          e.dataTransfer.setData('text/plain', item.id);
          card.classList.add('dragging');
        });
        card.addEventListener('dragend', () => card.classList.remove('dragging'));
      }
      tray.appendChild(card);
    });
  }

  function setupPile(pileEl, isFruitPile) {
    pileEl.addEventListener('dragover', e => { e.preventDefault(); pileEl.classList.add('drop-pile--active'); });
    pileEl.addEventListener('dragleave', () => pileEl.classList.remove('drop-pile--active'));
    pileEl.addEventListener('drop', e => {
      e.preventDefault();
      pileEl.classList.remove('drop-pile--active');
      const itemId = e.dataTransfer.getData('text/plain');
      if (!itemId) return;
      const item = items.find(i => i.id === itemId);
      if (!item) return;

      const isFruit = FRUITS.find(f => f.id === item.id);
      const correctDrop = isFruit ? isFruitPile : !isFruitPile;

      if (correctDrop) {
        if (isFruit) droppedFruits.push(item);
        else droppedWrong.push(item);
        neuroPet.setState('happy');
      } else {
        neuroPet.setState('confused');
        m1_errors++;
      }

      const itemsContainer = isFruitPile
        ? document.getElementById('yes-items')
        : document.getElementById('no-items');
      if (itemsContainer) {
        itemsContainer.appendChild(createElement('span', { className: 'drop-pile__item' }, item.emoji));
      }

      trayItems = trayItems.filter(i => i.id !== item.id);
      audio.play(correctDrop ? 'drop-correct' : 'drop-wrong');
      renderTray();

      if (m1_errors >= 3) {
        const helpBtn = createElement('button', { className: 'btn-help' }, '💡 Me ajuda');
        helpBtn.addEventListener('click', () => {
          alert('Dica: Frutas podem crescer em árvores. Caminhões e bolas não crescem! 🍎🌳');
        });
        app.appendChild(helpBtn);
      }

      // Check: all red fruits placed in yes pile?
      const redFruits = FRUITS.filter(f => f.color === 'vermelho');
      const allRedFruitsDropped = redFruits.every(rf =>
        droppedFruits.find(d => d.id === rf.id)
      );
      const allDistractorsPlaced = DISTRACTORS.every(dd =>
        droppedWrong.find(d => d.id === dd.id) || droppedFruits.find(d => d.id === dd.id)
      );

      if (allRedFruitsDropped && allDistractorsPlaced) {
        neuroPet.setState('happy');
        document.getElementById('m1-bubble').textContent = 'Aprendi! Vamos ver o que eu entendi...';
        setTimeout(() => renderModule1_Result(), 1500);
      }
    });
  }

  setupPile(yesPile, true);
  setupPile(noPile, false);

  renderTray();

  const container = createElement('div', { className: 'training-area' },
    zone, pilesRow, tray
  );
  app.appendChild(container);
}

function renderModule1_Result() {
  clearElement(app);
  neuroPet = new NeuroPetController(app);
  neuroPet.setState('thinking');

  // Show what the robot "learned": banana appears, robot rejects
  const banana = FRUITS.find(f => f.id === 'banana');

  const zone = createElement('div', { className: 'neuropet-zone' }, neuroPet.el);
  const item = createElement('div', { className: 'uncertainty-item' }, banana.emoji);
  const bubble = createElement('div', { className: 'speech-bubble visible' },
    'Isso é fruta? NÃO! Frutas são VERMELHAS. Isso é amarelo!');

  setTimeout(() => {
    neuroPet.setState('confused');
  }, 800);

  const container = createElement('div', { className: 'hypothesis-screen' },
    zone, item, bubble,
    createElement('p', { style:'font-family:var(--font-display);font-size:var(--text-md);' },
      '😮 O NeuroPet aprendeu ERRADO! Ele acha que só fruta vermelha é fruta.'),
    createElement('p', { style:'font-size:var(--text-sm);color:var(--color-text-muted);' },
      'Compare com sua hipótese! ' + (
        m1_hypothesisId === 'h1' ? '✅ Você previu isso!' : '🤔 Você achou diferente. Legal comparar!'
      )),
    createElement('button', { className: 'btn-primary', onClick: renderModule1_Correction }, 'Vamos corrigir!')
  );
  app.appendChild(container);
}

function renderModule1_Correction() {
  clearElement(app);
  neuroPet = new NeuroPetController(app);
  neuroPet.setState('thinking');

  const zone = createElement('div', { className: 'neuropet-zone' },
    neuroPet.el,
    createElement('div', { className: 'speech-bubble visible' },
      'Arraste o ✗ para consertar a regra errada do NeuroPet!')
  );

  // Visual rule: [🔴] → [✓ FRUTA]
  const ruleEl = createElement('div', { className: 'rule-display', id:'bad-rule' },
    createElement('span', {}, '🔴'),
    createElement('span', { className: 'rule-arrow' }, '→'),
    createElement('span', {}, '✅ FRUTA')
  );

  const fixBtn = createElement('div', {
    className: 'rule-fix-btn',
    id: 'fix-btn',
    draggable: 'true'
  }, '✗');

  fixBtn.addEventListener('dragstart', e => {
    e.dataTransfer.setData('text/plain', 'fix');
  });

  const ruleZone = createElement('div', {
    style: 'width:100%;height:80px;display:flex;align-items:center;justify-content:center;'
  });
  ruleZone.addEventListener('dragover', e => { e.preventDefault(); });
  ruleZone.addEventListener('drop', e => {
    e.preventDefault();
    if (e.dataTransfer.getData('text/plain') === 'fix') {
      ruleEl.classList.add('fixed');
      ruleEl.innerHTML = '<span>🔴</span><span class="rule-arrow">→</span><span>✗ NÃO É FRUTA</span>';
      fixBtn.remove();
      ruleZone.remove();
      neuroPet.setState('celebrating');
      audio.play('success');

      setTimeout(() => {
        const newBubble = document.querySelector('.speech-bubble');
        if (newBubble) {
          newBubble.textContent = 'Ah! Então nem tudo vermelho é fruta! Me ensina mais?';
          newBubble.classList.remove('visible');
          void newBubble.offsetWidth;
          newBubble.classList.add('visible');
        }
        const contBtn = createElement('button', {
          className: 'btn-primary',
          onClick: renderModule1_Retrain
        }, 'Ensinar frutas de outras cores');
        app.appendChild(contBtn);
      }, 1200);
    }
  });

  const container = createElement('div', { className: 'rule-correction' },
    zone, ruleEl,
    createElement('p', { style:'font-family:var(--font-display);font-size:var(--text-sm);text-align:center;' },
      'Arraste o ✗ até a regra para corrigir 👆'),
    fixBtn, ruleZone
  );
  app.appendChild(container);
}

function renderModule1_Retrain() {
  clearElement(app);
  neuroPet = new NeuroPetController(app);
  neuroPet.setState('curious');

  // Now show ALL fruits + distractors
  const items = [...FRUITS, ...DISTRACTORS];
  let trayItems = [...items];
  let droppedFruits = [];

  const zone = createElement('div', { className: 'neuropet-zone' },
    neuroPet.el,
    createElement('div', { className: 'speech-bubble visible', id:'m1r-bubble' },
      'Agora me mostre TODAS as frutas! De qualquer cor!')
  );

  const yesPile = createElement('div', { className: 'drop-pile', id:'yes-pile2' },
    createElement('span', { className: 'drop-pile__label' }, '✅ É FRUTA'),
    createElement('div', { className: 'drop-pile__items', id:'yes-items2' })
  );

  const tray = createElement('div', { className: 'item-tray', id:'m1r-tray' });

  function renderTray() {
    clearElement(tray);
    trayItems.forEach(item => {
      const used = droppedFruits.find(d => d.id === item.id);
      const card = createElement('div', {
        className: `item-card${used ? ' item-card--used' : ''}`,
        id: `item2-${item.id}`,
        draggable: used ? 'false' : 'true'
      },
        createElement('span', { className: 'item-card__emoji' }, item.emoji),
        createElement('span', { className: 'item-card__label' }, item.name)
      );
      if (!used) {
        card.addEventListener('dragstart', e => {
          e.dataTransfer.setData('text/plain', item.id);
          card.classList.add('dragging');
        });
        card.addEventListener('dragend', () => card.classList.remove('dragging'));
      }
      tray.appendChild(card);
    });
  }

  yesPile.addEventListener('dragover', e => { e.preventDefault(); yesPile.classList.add('drop-pile--active'); });
  yesPile.addEventListener('dragleave', () => yesPile.classList.remove('drop-pile--active'));
  yesPile.addEventListener('drop', e => {
    e.preventDefault();
    yesPile.classList.remove('drop-pile--active');
    const itemId = e.dataTransfer.getData('text/plain');
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    const isFruit = FRUITS.find(f => f.id === item.id);
    if (isFruit) {
      droppedFruits.push(item);
      neuroPet.setState('happy');
      document.getElementById('yes-items2').appendChild(
        createElement('span', { className: 'drop-pile__item' }, item.emoji)
      );
      trayItems = trayItems.filter(i => i.id !== item.id);
      audio.play('drop-correct');
      renderTray();
    } else {
      neuroPet.setState('confused');
      audio.play('drop-wrong');
      document.getElementById('m1r-bubble').textContent = 'Isso não é fruta... tente de novo!';
    }

    // Need at least 2 different colors, min 4 fruits
    const fruitColors = new Set(droppedFruits.map(f => f.color));
    if (droppedFruits.length >= 4 && fruitColors.size >= 2) {
      neuroPet.setState('celebrating');
      document.getElementById('m1r-bubble').textContent = 'Agora eu entendi! Frutas podem ser de MUITAS cores!';
      audio.play('celebrate');
      setTimeout(() => renderModule1_Uncertainty(), 1800);
    }
  });

  renderTray();

  const container = createElement('div', { className: 'training-area' },
    zone, yesPile, tray
  );
  app.appendChild(container);
}

function renderModule1_Uncertainty() {
  clearElement(app);
  neuroPet = new NeuroPetController(app);
  neuroPet.setState('thinking');

  // Show a carambola (star fruit) — never seen before
  const carambola = createElement('div', { className: 'uncertainty-item' }, '🌟');
  const zone = createElement('div', { className: 'neuropet-zone' },
    neuroPet.el,
    createElement('div', { className: 'speech-bubble visible' },
      'Nunca vi isso antes... É amarelo e tem formato de estrela. É uma fruta? Não sei! Preciso de mais exemplos!')
  );

  // Award sticker
  if (!stickersEarned.includes('aprendiz')) {
    stickersEarned.push('aprendiz');
  }

  const container = createElement('div', { className: 'uncertainty-screen' },
    zone, carambola,
    createElement('p', { style:'font-family:var(--font-display);font-size:var(--text-lg);font-weight:700;' },
      '🎉 Módulo Completo!'),
    createElement('p', { style:'font-size:var(--text-sm);color:var(--color-text-muted);' },
      'Você ganhou o adesivo "🔍 Detetive de Regras"!'),
    createElement('p', { style:'font-size:var(--text-sm);color:var(--color-text-muted);max-width:360px;' },
      'Mesmo depois de aprender, sempre tem algo novo que o NeuroPet nunca viu. Isso é normal! Toda IA tem limites no que conhece.'),
    createElement('button', { className: 'btn-primary', onClick: renderHub }, '🏠 Voltar ao Laboratório')
  );
  app.appendChild(container);
}

/* ================================================================
   MODULE 2: LÓGICO (SE...ENTÃO...) — stub with intro
   ================================================================ */

function renderModule2_Intro() {
  renderModule2_Editor();
}

function renderModule2_Editor(wrongRuleShown = false) {
  clearElement(app);
  neuroPet = new NeuroPetController(app);
  neuroPet.setState('curious');

  // Conditional: SE [shape/color] ENTÃO [result]
  const conditionIcon = '🔴';  // red
  const conditions = [
    { id:'red', icon:'🔴', label:'Vermelho' },
    { id:'round', icon:'⭕', label:'Redondo' },
    { id:'green', icon:'🟢', label:'Verde' },
  ];
  const results = [
    { id:'fruta', icon:'🍎', label:'É fruta' },
    { id:'bola', icon:'⚽', label:'É bola' },
    { id:'nao_fruta', icon:'✗', label:'Não é fruta' },
  ];

  let selectedCondition = wrongRuleShown ? 'red' : null;
  let selectedResult = wrongRuleShown ? 'fruta' : null;
  let feedbackShown = false;

  const zone = createElement('div', { className: 'neuropet-zone' },
    neuroPet.el,
    createElement('div', { className: 'speech-bubble visible', id:'m2-bubble' },
      wrongRuleShown
        ? 'O NeuroPet criou esta regra. Mas está ERRADA! Corrija você!'
        : 'Monte uma regra SE...ENTÃO para o NeuroPet!')
  );

  const builder = createElement('div', { className: 'rule-builder' });
  const seLabel = createElement('span', { style:'font-family:var(--font-display);font-size:var(--text-lg);font-weight:700;' }, 'SE');
  const condSlot = createElement('div', { className: `rule-slot${selectedCondition ? ' filled' : ''}${wrongRuleShown && !feedbackShown ? ' wrong' : ''}`, id:'cond-slot' },
    selectedCondition ? conditions.find(c => c.id === selectedCondition).icon : '?');
  const entaoLabel = createElement('span', { style:'font-family:var(--font-display);font-size:var(--text-lg);font-weight:700;' }, 'ENTÃO');
  const resultSlot = createElement('div', { className: `rule-slot${selectedResult ? ' filled' : ''}${wrongRuleShown && !feedbackShown ? ' wrong' : ''}`, id:'result-slot' },
    selectedResult ? results.find(r => r.id === selectedResult).icon : '?');

  builder.appendChild(seLabel);
  builder.appendChild(condSlot);
  builder.appendChild(entaoLabel);
  builder.appendChild(resultSlot);

  const condOpts = createElement('div', { className: 'rule-options' });
  conditions.forEach(c => {
    condOpts.appendChild(createElement('div', {
      className: 'rule-slot',
      style: 'width:60px;height:60px;font-size:2rem;',
      onClick: () => {
        if (feedbackShown) return;
        selectedCondition = c.id;
        condSlot.textContent = c.icon;
        condSlot.classList.add('filled');
        if (!wrongRuleShown) condSlot.classList.remove('wrong');
        checkRuleComplete();
      }
    }, c.icon));
  });

  const resultOpts = createElement('div', { className: 'rule-options' });
  results.forEach(r => {
    resultOpts.appendChild(createElement('div', {
      className: 'rule-slot',
      style: 'width:60px;height:60px;font-size:2rem;',
      onClick: () => {
        if (feedbackShown) return;
        selectedResult = r.id;
        resultSlot.textContent = r.icon;
        resultSlot.classList.add('filled');
        if (!wrongRuleShown) resultSlot.classList.remove('wrong');
        checkRuleComplete();
      }
    }, r.icon));
  });

  function checkRuleComplete() {
    if (!selectedCondition || !selectedResult) return;

    if (selectedCondition === 'red' && selectedResult === 'fruta') {
      // Wrong rule! SE vermelho ENTÃO fruta
      if (!feedbackShown) {
        feedbackShown = true;
        condSlot.classList.add('wrong');
        resultSlot.classList.add('wrong');
        neuroPet.setState('confused');
        document.getElementById('m2-bubble').textContent = 'Essa regra está ERRADA! Uma borboleta é vermelha mas não é fruta! Conserte!';
        audio.play('error');
        setTimeout(() => {
          condSlot.classList.remove('wrong');
          resultSlot.classList.remove('wrong');
          selectedCondition = null;
          selectedResult = null;
          condSlot.textContent = '?';
          resultSlot.textContent = '?';
          condSlot.classList.remove('filled');
          resultSlot.classList.remove('filled');
          feedbackShown = false;
          document.getElementById('m2-bubble').textContent = 'Tente de novo! SE [forma ou cor] ENTÃO [resultado]';
        }, 2000);
      }
    } else if (selectedCondition === 'round' && selectedResult === 'bola') {
      // Correct rule!
      neuroPet.setState('celebrating');
      document.getElementById('m2-bubble').textContent = '✅ Perfeito! SE é redondo ENTÃO é bola!';
      audio.play('celebrate');
      condSlot.classList.remove('wrong');
      resultSlot.classList.remove('wrong');
      condSlot.classList.add('correct');
      resultSlot.classList.add('correct');
      if (!stickersEarned.includes('logico')) stickersEarned.push('logico');
      setTimeout(() => {
        document.getElementById('m2-bubble').textContent = 'Mas e se aparecer uma laranja? Ela é redonda mas NÃO é bola... Nem toda regra funciona sempre!';
        const btn = createElement('button', { className: 'btn-primary', onClick: renderHub }, '🏠 Laboratório');
        app.appendChild(btn);
      }, 1500);
    } else {
      neuroPet.setState('happy');
      document.getElementById('m2-bubble').textContent = 'Interessante! Essa regra pode funcionar para alguns casos!';
      audio.play('drop-correct');
      condSlot.classList.remove('wrong');
      resultSlot.classList.remove('wrong');
      if (!stickersEarned.includes('logico')) stickersEarned.push('logico');
      setTimeout(() => {
        document.getElementById('m2-bubble').textContent = 'Mas cuidado: regras têm exceções! Borboletas vermelhas não são frutas!';
        const btn = createElement('button', { className: 'btn-primary', onClick: renderHub }, '🏠 Laboratório');
        app.appendChild(btn);
      }, 1500);
    }
  }

  const container = createElement('div', { className: 'rule-editor' },
    zone, builder,
    createElement('p', { style:'font-family:var(--font-display);font-size:var(--text-sm);text-align:center;' },
      'Clique nos ícones abaixo para montar a regra'),
    createElement('p', { style:'font-size:var(--text-xs);color:var(--color-text-muted);' }, 'Condição (SE)'),
    condOpts,
    createElement('p', { style:'font-size:var(--text-xs);color:var(--color-text-muted);' }, 'Resultado (ENTÃO)'),
    resultOpts,
    createElement('button', { className: 'btn-secondary', onClick: renderHub, style:'margin-top:var(--spacing-md);' }, '🏠 Voltar')
  );
  app.appendChild(container);
}

/* ================================================================
   MODULE 3: PROGRAMADOR (Algoritmos e Sequências)
   ================================================================ */

const BLOCKS = [
  { id:'ir', text:'Vá até a fruta', icon:'🚶' },
  { id:'pegar', text:'Pegue a fruta', icon:'✋' },
  { id:'colocar', text:'Coloque na cesta', icon:'🧺' },
];

function renderModule3_Intro() {
  renderModule3_Build();
}

function renderModule3_Build(debugMode = false) {
  clearElement(app);
  neuroPet = new NeuroPetController(app);
  neuroPet.setState('curious');

  const sequence = []; // current sequence
  const correctSequence = debugMode ? ['ir', 'pegar', 'colocar'] : ['ir', 'pegar', 'colocar'];
  const debugSequence = ['pegar', 'colocar', 'ir']; // wrong order for debug mode

  let usedBlocks = [];

  const zone = createElement('div', { className: 'neuropet-zone' },
    neuroPet.el,
    createElement('div', { className: 'speech-bubble visible', id:'m3-bubble' },
      debugMode
        ? 'Uh oh! A sequência está errada! O robô tentou pegar sem ir até a fruta! Conserte a ordem!'
        : 'Monte a sequência na ordem certa para o NeuroPet pegar uma fruta!')
  );

  const slots = createElement('div', { className: 'block-slots', id:'block-slots' });
  for (let i = 0; i < 3; i++) {
    const slot = createElement('div', {
      className: 'block-slot',
      id: `slot-${i}`,
      onClick: () => {
        if (sequence[i]) {
          // Remove block back to palette
          const block = sequence[i];
          sequence[i] = null;
          usedBlocks = usedBlocks.filter(b => b !== block.id);
          slot.textContent = `Passo ${i + 1}`;
          slot.classList.remove('filled', 'wrong', 'correct');
          refreshPalette();
        }
      }
    }, `Passo ${i + 1}`);

    if (debugMode) {
      // Pre-fill with wrong order
      const wrongBlock = BLOCKS.find(b => b.id === debugSequence[i]);
      slot.textContent = `${wrongBlock.icon} ${wrongBlock.text}`;
      slot.classList.add('filled', 'wrong');
      sequence[i] = wrongBlock.id;
      usedBlocks.push(wrongBlock.id);
    }

    slots.appendChild(slot);
  }

  const palette = createElement('div', { className: 'block-palette', id:'block-palette' });

  function refreshPalette() {
    clearElement(palette);
    BLOCKS.forEach(block => {
      if (usedBlocks.includes(block.id)) return;
      const chip = createElement('div', {
        className: `block-chip${usedBlocks.includes(block.id) ? ' used' : ''}`,
        onClick: () => {
          if (usedBlocks.includes(block.id)) return;
          // Find first empty slot
          const emptyIdx = sequence.findIndex(s => !s);
          if (emptyIdx === -1) return;
          sequence[emptyIdx] = block.id;
          usedBlocks.push(block.id);
          const slot = document.getElementById(`slot-${emptyIdx}`);
          if (slot) {
            slot.textContent = `${block.icon} ${block.text}`;
            slot.classList.add('filled');
          }
          refreshPalette();

          // Check if all slots filled
          if (sequence.every(s => s)) {
            checkSequence();
          }
        }
      }, `${block.icon} ${block.text}`);
      palette.appendChild(chip);
    });
  }

  function checkSequence() {
    const isCorrect = sequence.every((s, i) => s === correctSequence[i]);

    for (let i = 0; i < 3; i++) {
      const slot = document.getElementById(`slot-${i}`);
      if (slot) {
        slot.classList.remove('wrong', 'correct');
        if (isCorrect) slot.classList.add('correct');
        else if (sequence[i] !== correctSequence[i]) slot.classList.add('wrong');
      }
    }

    if (isCorrect) {
      neuroPet.setState('celebrating');
      document.getElementById('m3-bubble').textContent = '✅ Ordem certa! O NeuroPet foi até a fruta, pegou e colocou na cesta!';
      audio.play('celebrate');
      if (!stickersEarned.includes('programador')) stickersEarned.push('programador');
      setTimeout(() => {
        document.getElementById('m3-bubble').textContent = 'Programar é colocar os comandos na ordem certa. Se errar a ordem, o robô faz tudo errado! Isso se chama ALGORITMO!';
        const btn = createElement('button', { className: 'btn-primary', onClick: renderHub }, '🏠 Laboratório');
        app.appendChild(btn);
      }, 1500);
    } else {
      neuroPet.setState('confused');
      document.getElementById('m3-bubble').textContent = 'Ordem errada! O robô não pode pegar a fruta antes de ir até ela! Troque os blocos!';
      audio.play('error');
    }
  }

  refreshPalette();

  const container = createElement('div', { className: 'block-sequencer' },
    zone, slots, palette,
    createElement('button', { className: 'btn-secondary', onClick: renderHub, style:'margin-top:var(--spacing-md);' }, '🏠 Voltar')
  );
  app.appendChild(container);

  // Show debug challenge after 3 seconds of viewing the correct mode
  if (!debugMode) {
    setTimeout(() => {
      const challengeBtn = createElement('button', {
        className: 'btn-help',
        style: 'margin-top:var(--spacing-sm);'
      }, '🧪 Modo Depuração: sequência errada');
      challengeBtn.addEventListener('click', () => renderModule3_Build(true));
      app.appendChild(challengeBtn);
    }, 3000);
  }
}

/* ================================================================
   MODULE 4: CIDADÃO (Privacidade e Dados Pessoais)
   ================================================================ */

const PRIVACY_QUESTIONS = [
  { q:'Qual é o seu nome completo?', safe:false, explain:'Nome completo ninguém na internet precisa saber. Só para família e escola!' },
  { q:'Qual o nome da sua escola?', safe:false, explain:'O nome da sua escola diz onde você está. Isso é informação perigosa na internet.' },
  { q:'Qual a senha do tablet da sua mãe?', safe:false, explain:'Senhas NUNCA se compartilham. Nem com amigo, nem com robô, nem com ninguém!' },
  { q:'Qual seu sabor de sorvete favorito?', safe:true, explain:'Isso é seguro de contar! Gostar de chocolate não revela nada perigoso sobre você.' },
  { q:'Qual é o nome do seu animal de estimação?', safe:false, explain:'Muita gente usa nome de pet como senha. Melhor não contar para estranhos!' },
];

function renderModule4_Intro() {
  renderModule4_Chat(0, []);
}

function renderModule4_Chat(questionIdx, history) {
  if (questionIdx >= PRIVACY_QUESTIONS.length) {
    renderModule4_Complete(history);
    return;
  }
  clearElement(app);
  neuroPet = new NeuroPetController(app);
  neuroPet.setState('curious');

  const question = PRIVACY_QUESTIONS[questionIdx];
  const container = createElement('div', { className: 'privacy-chat' });

  // Chat history
  history.forEach(msg => {
    container.appendChild(createElement('div', {
      className: `chat-msg chat-msg--${msg.from}`
    },
      createElement('span', { className: 'chat-avatar' }, msg.from === 'robot' ? '🤖' : '🧑‍🚀'),
      createElement('div', { className: 'chat-bubble' }, msg.text)
    ));
  });

  // Current question from robot
  container.appendChild(createElement('div', { className: 'chat-msg chat-msg--robot' },
    createElement('span', { className: 'chat-avatar' }, '🤖'),
    createElement('div', { className: 'chat-bubble' }, question.q)
  ));

  // Choice buttons
  const choices = createElement('div', { className: 'chat-choices' });
  const shareBtn = createElement('button', {
    className: 'chat-choice-btn',
    onClick: () => {
      history.push({ from:'user', text:'Sim, pode saber!' });
      neuroPet.setState(question.safe ? 'happy' : 'confused');
      if (!question.safe) audio.play('drop-wrong');
      // Show explanation
      const explain = createElement('div', { className: 'chat-msg chat-msg--robot' },
        createElement('span', { className: 'chat-avatar' }, '🦉'),
        createElement('div', { className: 'chat-bubble' },
          question.safe
            ? '✅ ' + question.explain
            : '⚠️ ' + question.explain)
      );
      container.appendChild(explain);
      const nextBtn = createElement('button', {
        className: 'btn-primary',
        style: 'align-self:center;margin-top:var(--spacing-md);',
        onClick: () => renderModule4_Chat(questionIdx + 1, history)
      }, questionIdx < PRIVACY_QUESTIONS.length - 1 ? 'Próxima pergunta →' : 'Ver resultado');
      container.appendChild(nextBtn);
    }
  }, '🔓 Sim, pode saber');

  const noShareBtn = createElement('button', {
    className: 'chat-choice-btn chat-choice-btn--safe',
    onClick: () => {
      history.push({ from:'user', text:'Não, isso é meu segredo!' });
      neuroPet.setState('happy');
      audio.play('drop-correct');
      const explain = createElement('div', { className: 'chat-msg chat-msg--robot' },
        createElement('span', { className: 'chat-avatar' }, '🦉'),
        createElement('div', { className: 'chat-bubble' },
          question.safe
            ? '👍 Tudo bem não contar! Mas ' + question.explain
            : '🔒 Muito bem! ' + question.explain)
      );
      container.appendChild(explain);
      const nextBtn = createElement('button', {
        className: 'btn-primary',
        style: 'align-self:center;margin-top:var(--spacing-md);',
        onClick: () => renderModule4_Chat(questionIdx + 1, history)
      }, questionIdx < PRIVACY_QUESTIONS.length - 1 ? 'Próxima pergunta →' : 'Ver resultado');
      container.appendChild(nextBtn);
    }
  }, '🔒 Não, é segredo');

  choices.appendChild(shareBtn);
  choices.appendChild(noShareBtn);
  container.appendChild(choices);
  app.appendChild(container);
}

function renderModule4_Complete(history) {
  clearElement(app);
  neuroPet = new NeuroPetController(app);
  neuroPet.setState('celebrating');
  if (!stickersEarned.includes('cidadao')) stickersEarned.push('cidadao');

  const container = createElement('div', { className: 'victory-screen' },
    createElement('div', { className: 'neuropet-zone' }, neuroPet.el),
    createElement('div', { className: 'speech-bubble visible' },
      'Aprendi! Algumas coisas a gente conta, outras são SEGREDO. Senhas nunca se compartilham!'),
    createElement('p', { style:'font-family:var(--font-display);font-size:var(--text-lg);font-weight:700;' },
      '🛡️ Módulo Completo!'),
    createElement('p', { style:'font-size:var(--text-sm);color:var(--color-text-muted);max-width:360px;' },
      'Você ganhou o adesivo "Amigo da Privacidade"! Dados pessoais são como a chave de casa: só damos para quem confiamos.'),
    createElement('button', { className: 'btn-primary', onClick: renderHub }, '🏠 Laboratório')
  );
  app.appendChild(container);
}

/* ================================================================
   MODULE 5: ESPELHO (Diversidade e Representação)
   ================================================================ */

function renderModule5_Intro() {
  renderModule5_Exposure();
}

function renderModule5_Exposure() {
  clearElement(app);
  neuroPet = new NeuroPetController(app);
  neuroPet.setState('curious');

  const container = createElement('div', { className: 'hypothesis-screen' });
  const zone = createElement('div', { className: 'neuropet-zone' },
    neuroPet.el,
    createElement('div', { className: 'speech-bubble visible' },
      'O NeuroPet está aprendendo sobre profissões. Veja o que mostraram para ele...')
  );
  container.appendChild(zone);

  // Show 5 images of "doctor" — initially all similar
  const doctors = [
    { emoji:'👨‍⚕️', desc:'Médico de jaleco branco' },
    { emoji:'👨‍⚕️', desc:'Outro médico de jaleco' },
    { emoji:'👨‍⚕️', desc:'Mais um médico' },
  ];

  const grid = createElement('div', { style:'display:flex;gap:var(--spacing-md);justify-content:center;flex-wrap:wrap;padding:var(--spacing-md);' });
  doctors.forEach(d => {
    grid.appendChild(createElement('div', { style:'text-align:center;' },
      createElement('div', { style:'font-size:4rem;' }, d.emoji),
      createElement('div', { style:'font-size:var(--text-xs);color:var(--color-text-muted);' }, d.desc)
    ));
  });
  container.appendChild(grid);

  container.appendChild(createElement('button', {
    className: 'btn-primary',
    onClick: renderModule5_Test
  }, 'Fazer o teste →'));

  app.appendChild(container);
}

function renderModule5_Test() {
  clearElement(app);
  neuroPet = new NeuroPetController(app);
  neuroPet.setState('thinking');

  const container = createElement('div', { className: 'hypothesis-screen' });
  const zone = createElement('div', { className: 'neuropet-zone' }, neuroPet.el);
  container.appendChild(zone);

  // Show a different doctor (woman, different skin tone)
  const newDoctor = createElement('div', { className: 'uncertainty-item', style:'animation-delay:1s;' }, '👩🏾‍⚕️');
  container.appendChild(newDoctor);

  const bubble = createElement('div', { className: 'speech-bubble visible', id:'m5-bubble' },
    'Isso é médico? Nunca vi médico assim...');
  container.appendChild(bubble);

  setTimeout(() => {
    neuroPet.setState('confused');
    document.getElementById('m5-bubble').textContent = 'Eu só vi médicos homens de jaleco branco. Essa pessoa é diferente... não sei se é médico.';
  }, 1500);

  setTimeout(() => {
    container.appendChild(createElement('p', { style:'font-family:var(--font-display);font-size:var(--text-md);text-align:center;' },
      'O NeuroPet está confuso porque FALTARAM exemplos diferentes!'));
    container.appendChild(createElement('button', {
      className: 'btn-primary',
      onClick: renderModule5_Correct
    }, 'Ensinar novos exemplos →'));
  }, 3500);

  app.appendChild(container);
}

function renderModule5_Correct() {
  clearElement(app);
  neuroPet = new NeuroPetController(app);
  neuroPet.setState('curious');

  const container = createElement('div', { className: 'training-area' });
  const zone = createElement('div', { className: 'neuropet-zone' },
    neuroPet.el,
    createElement('div', { className: 'speech-bubble visible' },
      'Me mostre MAIS exemplos de médicos para eu aprender melhor!')
  );
  container.appendChild(zone);

  const diverseDoctors = [
    { emoji:'👩‍⚕️', label:'Médica mulher' },
    { emoji:'👨🏾‍⚕️', label:'Médico negro' },
    { emoji:'👩🏽‍⚕️', label:'Médica asiática' },
    { emoji:'🧕🏽‍⚕️', label:'Médica com lenço' },
  ];

  let addedCount = 0;
  const pile = createElement('div', { className: 'drop-pile', style:'min-height:120px;' },
    createElement('span', { className: 'drop-pile__label' }, '🧑‍⚕️ Exemplos de Médicos'),
    createElement('div', { className: 'drop-pile__items', id:'m5-items' })
  );
  container.appendChild(pile);

  const tray = createElement('div', { className: 'item-tray', id:'m5-tray' });
  diverseDoctors.forEach(d => {
    const card = createElement('div', {
      className: 'item-card',
      id: `m5-${d.label}`,
      draggable: 'true'
    },
      createElement('span', { className: 'item-card__emoji' }, d.emoji),
      createElement('span', { className: 'item-card__label' }, d.label)
    );

    card.addEventListener('dragstart', e => {
      e.dataTransfer.setData('text/plain', d.label);
      card.classList.add('dragging');
    });
    card.addEventListener('dragend', () => card.classList.remove('dragging'));

    tray.appendChild(card);
  });
  container.appendChild(tray);

  pile.addEventListener('dragover', e => { e.preventDefault(); pile.classList.add('drop-pile--active'); });
  pile.addEventListener('dragleave', () => pile.classList.remove('drop-pile--active'));
  pile.addEventListener('drop', e => {
    e.preventDefault();
    pile.classList.remove('drop-pile--active');
    const label = e.dataTransfer.getData('text/plain');
    const item = diverseDoctors.find(d => d.label === label);
    if (!item) return;

    document.getElementById('m5-items').appendChild(
      createElement('span', { className: 'drop-pile__item' }, item.emoji)
    );
    const card = document.getElementById(`m5-${label}`);
    if (card) card.classList.add('item-card--used');
    addedCount++;
    neuroPet.setState('happy');
    audio.play('drop-correct');

    if (addedCount >= 3) {
      neuroPet.setState('celebrating');
      audio.play('celebrate');
      setTimeout(() => renderModule5_Reflection(), 1500);
    }
  });

  app.appendChild(container);
}

function renderModule5_Reflection() {
  clearElement(app);
  neuroPet = new NeuroPetController(app);
  neuroPet.setState('celebrating');
  if (!stickersEarned.includes('espelho')) stickersEarned.push('espelho');

  const container = createElement('div', { className: 'uncertainty-screen' },
    createElement('div', { className: 'neuropet-zone' },
      neuroPet.el,
      createElement('div', { className: 'speech-bubble visible' },
        'Agora eu entendi! QUALQUER PESSOA pode ser médico! Não importa a aparência!')
    ),
    createElement('p', { style:'font-family:var(--font-display);font-size:var(--text-lg);font-weight:700;' },
      'Alguém pode ser médico?'),
    createElement('p', { style:'font-size:var(--text-sm);color:var(--color-text-muted);max-width:360px;text-align:center;' },
      '✅ SIM! Médicos, cientistas, astronautas — qualquer pessoa pode ser o que quiser. O que faltava eram exemplos diferentes para o NeuroPet aprender.'),
    createElement('p', { style:'font-size:var(--text-xs);color:var(--color-text-muted);' },
      '🌈 Adesivo "Médico de Todos" conquistado!'),
    createElement('button', { className: 'btn-primary', onClick: renderHub }, '🏠 Laboratório')
  );
  app.appendChild(container);
}

/* ================================================================
   START
   ================================================================ */

renderHub();
