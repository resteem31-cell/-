(function () {
  'use strict';

  var $ = function (s, el) { return (el || document).querySelector(s); };

  /* ---------- Header shadow & reveal-on-scroll ---------- */
  var header = $('.header');
  var onScroll = function () { header.classList.toggle('is-scrolled', window.scrollY > 10); };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });

    // Hide the mobile sticky button while the quiz or the form is on screen
    var sticky = $('#stickyCta');
    var onScreen = {};
    var stickyIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { onScreen[e.target.id] = e.isIntersecting; });
      sticky.classList.toggle('is-hidden', onScreen.test || onScreen.consult);
    }, { threshold: 0.05 });
    stickyIo.observe($('#test'));
    stickyIo.observe($('#consult'));
  } else {
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------- Products ---------- */
  var PRODUCTS = {
    foampack: { name: 'One-Shot Clear Foam Pack', kr: '원샷 클리어 폼팩', img: 'assets/img/foampack.jpg', step: '클렌징 & 팩' },
    ampoule:  { name: 'Cell Active Ampoule Shot', kr: '셀 액티브 앰플샷', img: 'assets/img/ampoule.jpg', step: '첫 단계 앰플' },
    serum:    { name: 'Cell Tension Capsule Serum', kr: '셀 텐션 캡슐 세럼', img: 'assets/img/serum.jpg', step: '집중 세럼' },
    cream:    { name: 'Contour Modeling Cream', kr: '컨투어 모델링 크림', img: 'assets/img/cream.jpg', step: '마무리 크림' }
  };

  /* ---------- Skin type quiz ---------- */
  // Each option adds points to dry / normal / combo / oily / sensitive, or sets the main concern.
  var QUESTIONS = [
    { q: '세안 후 아무것도 바르지 않고 30분이 지나면 피부는 어떤가요?', o: [
      ['얼굴 전체가 당기고 각질이 일어나요', { dry: 2 }],
      ['크게 불편함 없이 편안해요', { normal: 2 }],
      ['볼은 당기는데 이마·코는 번들거려요', { combo: 2 }],
      ['얼굴 전체가 금방 번들거려요', { oily: 2 }]
    ]},
    { q: '오후가 되면 화장은 어떻게 되나요?', o: [
      ['들뜨고 잔주름에 끼어요', { dry: 2 }],
      ['아침과 크게 다르지 않아요', { normal: 2 }],
      ['코와 이마 주변만 무너져요', { combo: 2 }],
      ['전체적으로 무너지고 번들거려요', { oily: 2 }]
    ]},
    { q: '손으로 만졌을 때 피부결은 어떤가요?', o: [
      ['거칠고 푸석해요', { dry: 2 }],
      ['부드럽고 매끄러워요', { normal: 2 }],
      ['부위마다 달라요', { combo: 2 }],
      ['기름기가 느껴지고 모공이 만져져요', { oily: 2 }]
    ]},
    { q: '모공은 어느 정도 보이나요?', o: [
      ['거의 보이지 않아요', { dry: 1 }],
      ['코 주변에만 조금 보여요', { normal: 1 }],
      ['T존(이마·코) 모공이 눈에 띄어요', { combo: 1 }],
      ['볼까지 넓게 보여요', { oily: 1 }]
    ]},
    { q: '새 화장품을 사용하면 피부가 어떤가요?', o: [
      ['붉어지거나 따가울 때가 많아요', { sensitive: 3 }],
      ['가끔 예민해질 때가 있어요', { sensitive: 1 }],
      ['거의 문제가 없어요', {}]
    ]},
    { q: '요즘 가장 신경 쓰이는 피부 고민은 무엇인가요?', concern: true, o: [
      ['주름과 탄력 저하', { concern: 'wrinkle' }],
      ['건조함과 속당김', { concern: 'dry' }],
      ['칙칙함과 흐려진 얼굴 윤곽', { concern: 'dull' }],
      ['모공과 트러블, 각질', { concern: 'trouble' }]
    ]}
  ];

  var CONCERNS = {
    wrinkle: { label: '주름·탄력 저하', product: 'serum', checks: ['주름·탄력 저하'] },
    dry:     { label: '건조함·속당김', product: 'ampoule', checks: ['건조함·속당김'] },
    dull:    { label: '칙칙함·윤곽', product: 'cream', checks: ['칙칙한 피부톤', '처진 윤곽·붓기'] },
    trouble: { label: '모공·트러블·각질', product: 'foampack', checks: ['모공·피지', '트러블·민감', '각질·거친 결'] }
  };

  var TYPES = {
    dry: {
      name: '건성 피부',
      desc: '유분과 수분이 모두 부족해 쉽게 당기고, 잔주름이 도드라지기 쉬운 피부예요.',
      tip: '<b>케어 포인트</b> 세안 직후 바로 수분을 채우고, 장벽을 지키는 세라마이드·히알루론산 보습으로 촉촉함을 오래 잠가 주세요.',
      product: 'ampoule'
    },
    normal: {
      name: '중성 피부',
      desc: '유수분 밸런스가 좋은 편이에요. 지금의 건강한 컨디션을 오래 지키는 것이 중요해요.',
      tip: '<b>케어 포인트</b> 지금의 탄력을 유지할 수 있도록 고효능 안티에이징 성분으로 미리 꾸준히 관리해 주세요.',
      product: 'serum'
    },
    combo: {
      name: '복합성 피부',
      desc: 'T존은 번들거리고 볼은 건조한, 부위별로 다른 관리가 필요한 피부예요.',
      tip: '<b>케어 포인트</b> 약산성 세안으로 유분과 각질을 부드럽게 정돈하고, 건조한 부위에는 수분을 한 번 더 덧발라 주세요.',
      product: 'foampack'
    },
    oily: {
      name: '지성 피부',
      desc: '피지 분비가 활발해 번들거림과 모공 고민이 생기기 쉬운 피부예요.',
      tip: '<b>케어 포인트</b> 피부 장벽을 해치지 않는 순한 세안이 가장 중요해요. 속은 촉촉하게, 겉은 산뜻하게 마무리해 주세요.',
      product: 'foampack'
    }
  };

  var quiz = {
    i: 0,
    answers: [],
    els: {
      start: $('#quizStart'), run: $('#quizRun'), result: $('#quizResult'),
      bar: $('#quizBar'), count: $('#quizCount'), q: $('#quizQ'), opts: $('#quizOptions'), back: $('#quizBack')
    }
  };

  function show(which) {
    ['start', 'run', 'result'].forEach(function (k) { quiz.els[k].hidden = k !== which; });
  }

  function renderQuestion() {
    var item = QUESTIONS[quiz.i];
    var e = quiz.els;
    e.bar.style.width = ((quiz.i) / QUESTIONS.length * 100) + '%';
    e.count.textContent = 'Q' + (quiz.i + 1) + ' / ' + QUESTIONS.length;
    e.q.textContent = item.q;
    e.opts.innerHTML = '';
    item.o.forEach(function (opt, idx) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'quiz__opt' + (quiz.answers[quiz.i] === idx ? ' is-selected' : '');
      b.textContent = opt[0];
      b.addEventListener('click', function () { choose(idx, b); });
      e.opts.appendChild(b);
    });
    e.back.disabled = quiz.i === 0;
  }

  var choosing = false;
  function choose(idx, btn) {
    if (choosing) return;
    choosing = true;
    quiz.answers[quiz.i] = idx;
    Array.prototype.forEach.call(quiz.els.opts.children, function (c) { c.classList.remove('is-selected'); });
    btn.classList.add('is-selected');
    setTimeout(function () {
      choosing = false;
      if (quiz.i < QUESTIONS.length - 1) { quiz.i++; renderQuestion(); }
      else { finish(); }
    }, 280);
  }

  function finish() {
    var score = { dry: 0, normal: 0, combo: 0, oily: 0, sensitive: 0 };
    var concern = 'wrinkle';
    quiz.answers.forEach(function (idx, qi) {
      var effect = QUESTIONS[qi].o[idx][1];
      Object.keys(effect).forEach(function (k) {
        if (k === 'concern') concern = effect[k];
        else score[k] += effect[k];
      });
    });

    var type = ['dry', 'combo', 'oily', 'normal'].reduce(function (best, k) {
      return score[k] > score[best] ? k : best;
    }, 'dry');
    var t = TYPES[type];
    var sensitive = score.sensitive >= 3;
    var typeName = (sensitive ? '민감 ' : '') + t.name;

    var main = CONCERNS[concern].product;
    var second = t.product !== main ? t.product : (main === 'serum' ? 'ampoule' : 'serum');

    $('#resultType').textContent = typeName;
    $('#resultDesc').textContent = t.desc + (sensitive ? ' 외부 자극에 쉽게 반응하는 편이니 순한 제품으로 천천히 관리해 주세요.' : '');
    $('#resultTip').innerHTML = t.tip;
    $('#resultProducts').innerHTML = [main, second].map(function (key) {
      var p = PRODUCTS[key];
      return '<a class="result__product" href="#p-' + key + '"><img src="' + p.img + '" alt="">' +
        '<div><small>' + p.step + '</small><strong>' + p.name + '</strong><span>' + p.kr + '</span></div></a>';
    }).join('');
    quiz.els.bar.style.width = '100%';

    var answerText = quiz.answers.map(function (idx, qi) { return 'Q' + (qi + 1) + '. ' + QUESTIONS[qi].o[idx][0]; }).join(' / ');
    setSkinResult({
      skinType: typeName,
      concern: CONCERNS[concern].label,
      recommended: PRODUCTS[main].kr + ', ' + PRODUCTS[second].kr,
      answers: answerText
    });
    // Pre-check the matching concerns on the form (the visitor can still change them)
    CONCERNS[concern].checks.forEach(function (v) {
      var box = document.querySelector('input[name="concerns"][value="' + v + '"]');
      if (box) box.checked = true;
    });

    show('result');
    $('#quiz').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  $('#quizBegin').addEventListener('click', function () { quiz.i = 0; quiz.answers = []; show('run'); renderQuestion(); });
  quiz.els.back.addEventListener('click', function () { if (quiz.i > 0) { quiz.i--; renderQuestion(); } });
  $('#quizRetry').addEventListener('click', function () { quiz.i = 0; quiz.answers = []; show('run'); renderQuestion(); });

  /* ---------- Consultation form ---------- */
  var form = $('#consultForm');
  var skinResult = { skinType: '미응시', concern: '', recommended: '', answers: '' };

  function setSkinResult(r) {
    skinResult = r;
    $('#formSkinValue').textContent = r.skinType + ' · ' + r.concern;
    $('#formSkinLink').textContent = '다시 테스트하기 →';
  }

  var cfg = window.ANADO_CONFIG || {};
  var notice = $('#formNotice');
  function showNotice(text) {
    notice.textContent = text;
    notice.hidden = !text;
    if (text) notice.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  if (!cfg.NOTIFY_EMAIL) showNotice('[관리자 안내] 신청서를 받을 메일 주소가 설정되지 않았습니다. js/config.js 의 NOTIFY_EMAIL 을 설정해 주세요.');

  // Phone auto-format: 01012345678 -> 010-1234-5678
  var phone = $('#f-phone');
  phone.addEventListener('input', function () {
    var d = phone.value.replace(/\D/g, '').slice(0, 11);
    if (d.length > 7) d = d.replace(/^(\d{3})(\d{3,4})(\d{4})$/, '$1-$2-$3').replace(/^(\d{3})(\d{4})(\d{1,3})$/, '$1-$2-$3');
    else if (d.length > 3) d = d.slice(0, 3) + '-' + d.slice(3);
    phone.value = d;
  });

  var validators = {
    name: function (v) { return v.trim().length >= 2; },
    age: function (v) { var a = parseInt(v, 10); return a >= 19 && a <= 99; },
    region: function (v) { return !!v; },
    phone: function (v) { return /^01[016789]-?\d{3,4}-?\d{4}$/.test(v); }
  };

  function validateField(name) {
    var el = form.elements[name];
    var ok = validators[name](el.value);
    el.closest('.field').classList.toggle('is-invalid', !ok);
    return ok;
  }

  Object.keys(validators).forEach(function (name) {
    var el = form.elements[name];
    el.addEventListener('blur', function () { if (el.value) validateField(name); });
    el.addEventListener('input', function () {
      if (el.closest('.field').classList.contains('is-invalid')) validateField(name);
    });
  });
  $('#f-privacy').addEventListener('change', function () {
    $('#privacyErr').classList.toggle('is-shown', !this.checked);
  });

  function utm(key) {
    try { return new URLSearchParams(location.search).get(key) || ''; } catch (e) { return ''; }
  }

  var submitting = false;
  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    if (submitting) return;

    var firstBad = null;
    Object.keys(validators).forEach(function (name) {
      if (!validateField(name) && !firstBad) firstBad = form.elements[name];
    });
    var privacy = $('#f-privacy').checked;
    $('#privacyErr').classList.toggle('is-shown', !privacy);
    if (!privacy && !firstBad) firstBad = $('#f-privacy');
    if (firstBad) { firstBad.focus(); return; }

    var name = form.elements.name.value.trim();
    var concerns = Array.prototype.filter.call(form.querySelectorAll('input[name="concerns"]'), function (c) { return c.checked; })
      .map(function (c) { return c.value; }).join(', ');
    // Keys become the row labels in the notification email.
    var data = {
      '이름': name,
      '나이': form.elements.age.value,
      '지역': form.elements.region.value,
      '전화번호': form.elements.phone.value,
      '피부 고민': concerns || '-',
      '피부타입 테스트': skinResult.skinType + (skinResult.concern ? ' (' + skinResult.concern + ')' : ''),
      '추천 제품': skinResult.recommended || '-',
      '남기고 싶은 말': form.elements.message.value.trim() || '-',
      '개인정보 동의': '동의',
      '문자 수신 동의': $('#f-marketing').checked ? '동의' : '미동의',
      '유입 경로': [utm('utm_source'), utm('utm_campaign')].filter(Boolean).join(' / ') || '-',
      '테스트 응답': skinResult.answers || '-',
      _subject: '[아나도 상담신청] ' + name + ' / ' + form.elements.region.value + ' / ' + form.elements.age.value + '세',
      _template: 'table',
      _captcha: 'false'
    };

    var btn = $('#submitBtn');
    var reset = function () {
      submitting = false;
      btn.disabled = false;
      btn.textContent = '무료 상담 신청하기';
    };
    submitting = true;
    btn.disabled = true;
    btn.textContent = '신청 중입니다…';
    showNotice('');

    var done = function () {
      $('#thanksName').textContent = name;
      form.hidden = true;
      var t = $('#thanks');
      t.hidden = false;
      t.focus();
      t.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    // Bots fill the hidden field; pretend success without sending.
    if (form.elements.website.value) { setTimeout(done, 400); return; }

    if (!cfg.NOTIFY_EMAIL) {
      console.warn('[ANADO] NOTIFY_EMAIL 미설정 — 신청 내용이 발송되지 않았습니다.', data);
      setTimeout(done, 400);
      return;
    }

    // FormSubmit (formsubmit.co) forwards the fields to the email address as a table.
    fetch('https://formsubmit.co/ajax/' + cfg.NOTIFY_EMAIL.trim(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(data)
    })
      .then(function (res) { return res.json().catch(function () { return {}; }); })
      .then(function (json) {
        if (String(json.success) === 'true') { done(); return; }
        reset();
        var msg = String(json.message || '');
        if (/activat/i.test(msg)) {
          showNotice('[관리자 안내] 메일 수신 인증이 필요합니다. ' + cfg.NOTIFY_EMAIL + ' 메일함(스팸함 포함)에 온 FormSubmit 인증 메일의 "Activate Form" 버튼을 누른 뒤 다시 신청해 주세요.');
        } else {
          showNotice('일시적인 오류로 신청이 접수되지 않았습니다. 잠시 후 다시 시도해 주세요.' + (msg ? ' (' + msg + ')' : ''));
        }
      })
      .catch(function () {
        reset();
        showNotice('인터넷 연결이 불안정해 신청이 접수되지 않았습니다. 잠시 후 다시 시도해 주세요.');
      });
  });
})();
