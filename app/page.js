'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  CalendarCheck,
  ChevronRight,
  Clock3,
  DoorClosed,
  Instagram,
  Leaf,
  MapPin,
  Menu,
  MessageCircle,
  Phone,
  ShieldCheck,
  Sparkles,
  UserRoundCheck,
  X,
} from 'lucide-react';

const services = [
  {
    name: 'SSパーツ',
    time: '15分',
    text: '鼻下｜もみあげ｜おへそ周り',
    plans: [
      { label: '1回', price: '￥2,000' },
      { label: '6回コース', price: '￥12,000' },
      { label: '12回コース', price: '￥24,000' },
    ],
  },
  {
    name: 'Sパーツ',
    time: '30分',
    text: '両脇｜両手の甲指｜えり足',
    plans: [
      { label: '1回', price: '￥3,000' },
      { label: '6回コース', price: '￥18,000' },
      { label: '12回コース', price: '￥36,000' },
    ],
  },
  {
    name: 'Lパーツ',
    time: '40分',
    text: '両ヒジ上｜両ヒザ下｜背中上｜背中下｜両ヒザ上｜両ヒザ下',
    plans: [
      { label: '1回', price: '￥6,000' },
      { label: '6回コース', price: '￥36,000' },
      { label: '12回コース', price: '￥72,000' },
    ],
  },
  {
    name: 'メンズひげ',
    time: '20分',
    price: '1回 ￥4,000から',
    text: '毎日のひげ剃り負担を減らしたい方向け。濃さや範囲を確認しながら、無理のないペースで進めます。',
    features: ['部分相談OK', '都度払い', '初回カウンセリング込み'],
  },
];

const serviceOptions = services.flatMap((service) => (
  service.plans
    ? service.plans.map((plan) => `${service.name} ${plan.label}`)
    : [service.name]
));

const timeSlots = ['10:00', '11:30', '13:00', '14:30', '16:00', '17:30', '19:00'];

const salonPhotos = [
  {
    src: '/images/exterior.jpg',
    label: '外観',
    title: '木製ドアのエントランス',
    text: '黒い外壁と木の扉が目印です。',
  },
  {
    src: '/images/title1.jpg',
    label: '看板',
    title: 'Pulito サイン',
    text: '壁面のサインを目印にお越しください。',
  },
  {
    src: '/images/dark_exterior.jpg',
    label: '夜の外観',
    title: '夜も見つけやすい入口',
    text: 'ライトアップされた外観で、夕方以降の来店も安心です。',
  },
  {
    src: '/images/bed1.jpg',
    label: '施術室',
    title: '完全個室の施術スペース',
    text: '木の質感を活かした落ち着いた個室です。',
  },
  {
    src: '/images/wating1.jpg',
    label: '店内',
    title: '待合スペース',
    text: '予約時間まで静かに過ごせるスペースです。',
  },
  {
    src: '/images/bed2.jpg',
    label: '施術室',
    title: '清潔感のある施術環境',
    text: '機器とベッドをゆったり配置しています。',
  },
];

const initialForm = {
  name: '',
  kana: '',
  phone: '',
  email: '',
  service: serviceOptions[0],
  date: '',
  time: '10:00',
  note: '',
};

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState({ type: 'idle', message: '' });
  const [bookedTimes, setBookedTimes] = useState([]);
  const [availabilityStatus, setAvailabilityStatus] = useState('idle');

  const minDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    return date.toISOString().slice(0, 10);
  }, []);

  const updateForm = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  useEffect(() => {
    if (!form.date) {
      setBookedTimes([]);
      setAvailabilityStatus('idle');
      return;
    }

    const controller = new AbortController();

    async function loadAvailability() {
      setAvailabilityStatus('loading');

      try {
        const response = await fetch(`/api/reservations/availability?date=${encodeURIComponent(form.date)}`, {
          signal: controller.signal,
        });
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || '空き状況の取得に失敗しました。');
        }

        const nextBookedTimes = result.bookedTimes || [];
        setBookedTimes(nextBookedTimes);
        setAvailabilityStatus('ready');

        if (nextBookedTimes.includes(form.time)) {
          const nextAvailableTime = timeSlots.find((slot) => !nextBookedTimes.includes(slot));
          setForm((current) => ({ ...current, time: nextAvailableTime || '' }));
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          setBookedTimes([]);
          setAvailabilityStatus('error');
        }
      }
    }

    loadAvailability();

    return () => controller.abort();
  }, [form.date, form.time]);

  const showFallbackImage = (event) => {
    if (event.currentTarget.dataset.fallbackApplied === 'true') {
      return;
    }
    event.currentTarget.dataset.fallbackApplied = 'true';
    event.currentTarget.src = '/images/bed2.jpg';
  };

  const submitReservation = async (event) => {
    event.preventDefault();
    setStatus({ type: 'loading', message: '予約内容を送信しています。' });

    try {
      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '予約の送信に失敗しました。');
      }

      setStatus({
        type: 'success',
        message: result.mode === 'demo'
          ? 'デモ受付が完了しました。Supabase環境変数を設定すると予約がデータベースに保存されます。'
          : '予約リクエストを受け付けました。サロンから確認の連絡をお送りします。',
      });
      setForm(initialForm);
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    }
  };

  const navItems = [
    ['コンセプト', '#concept'],
    ['外観・内観', '#gallery'],
    ['メニュー', '#menu'],
    ['予約', '#reserve'],
    ['アクセス', '#access'],
  ];

  return (
    <main>
      <header className="fixed inset-x-0 top-0 z-50">
        <div className="shell mt-3">
          <div className="glass flex h-16 items-center justify-between rounded-lg px-4 shadow-sm">
            <a href="#top" className="flex items-center gap-2 font-bold tracking-[0.12em] text-[#24211d]">
              <img
                src="/images/103370905_2766175200281932_2052005119665640928_n.jpg"
                alt=""
                aria-hidden="true"
                className="h-9 w-9 rounded-md object-cover"
              />
              pulito
            </a>
            <nav className="hidden items-center gap-7 text-sm font-bold text-[#4b433c] md:flex">
              {navItems.map(([label, href]) => (
                <a key={href} href={href} className="transition hover:text-[#9b5d3a]">{label}</a>
              ))}
            </nav>
            <a className="primary-button hidden md:inline-flex" href="#reserve">
              <CalendarCheck className="h-4 w-4" />
              予約する
            </a>
            <button
              type="button"
              className="grid h-10 w-10 place-items-center rounded-lg border border-[#e7ddd3] md:hidden"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label="メニュー"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
          {menuOpen && (
            <nav className="glass mt-2 grid rounded-lg p-3 text-sm font-bold md:hidden">
              {navItems.map(([label, href]) => (
                <a key={href} href={href} onClick={() => setMenuOpen(false)} className="rounded-md px-3 py-3 text-[#4b433c]">
                  {label}
                </a>
              ))}
            </nav>
          )}
        </div>
      </header>

      <section id="top" className="relative min-h-[92vh] overflow-hidden">
        <div className="hero-media absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=1800&q=82"
            alt="落ち着いたプライベートサロンの施術ルーム"
            className="h-full w-full object-cover"
            onError={showFallbackImage}
          />
        </div>
        <div className="shell relative z-10 flex min-h-[92vh] items-end pb-16 pt-28 md:items-center md:pb-0">
          <div className="max-w-2xl text-white">
            <p className="mb-4 inline-flex rounded-md bg-white/16 px-3 py-2 text-sm font-bold backdrop-blur">
              完全予約制・都度払い・現地決済
            </p>
            <h1 className="text-5xl font-bold leading-tight md:text-7xl">pulito</h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-white/90 md:text-xl">
              1組ずつ向き合う、静かな脱毛サロン。肌状態、痛みの感じ方、通うペースに合わせて無理のない予約を組みます。
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a className="primary-button" href="#reserve">
                空き枠を選んで予約
                <ChevronRight className="h-4 w-4" />
              </a>
              <a className="secondary-button" href="#menu">メニューを見る</a>
            </div>
          </div>
        </div>
      </section>

      <section id="concept" className="section-pad bg-[#fffdf9]">
        <div className="shell grid gap-10 md:grid-cols-[0.9fr_1.1fr] md:items-center">
          <div>
            <p className="text-sm font-bold text-[#9b5d3a]">PRIVATE CARE</p>
            <h2 className="mt-3 text-3xl font-bold leading-tight md:text-5xl">人目を気にせず相談できる完全予約制。</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              [DoorClosed, '1組限定', '待合で他のお客様と重なりにくい予約設計。'],
              [ShieldCheck, '肌確認', '出力や施術範囲を毎回確認して調整。'],
              [Leaf, '都度払い', '契約に縛られず、必要なタイミングで通えます。'],
            ].map(([Icon, title, text]) => (
              <article key={title} className="rounded-lg border border-[#e7ddd3] bg-white p-5">
                <Icon className="h-6 w-6 text-[#74856f]" />
                <h3 className="mt-5 font-bold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#6f6760]">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="gallery" className="section-pad bg-[#24211d] text-white">
        <div className="shell">
          <div className="mb-9 grid gap-4 md:grid-cols-[0.7fr_1fr] md:items-end">
            <div>
              <p className="text-sm font-bold text-[#d7a29a]">SALON PHOTOS</p>
              <h2 className="mt-3 text-3xl font-bold md:text-5xl">外観・内観</h2>
            </div>
            <p className="text-sm leading-7 text-white/72">
              外観、入口、施術室、待合スペースを事前に確認できます。完全予約制のため、落ち着いた空間で過ごせます。
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {salonPhotos.map((photo, index) => (
              <article
                key={photo.src}
                className={`${index === 0 || index === 5 ? 'md:col-span-2' : ''} overflow-hidden rounded-lg border border-white/12 bg-white/6`}
              >
                <div className={`${index === 0 || index === 5 ? 'aspect-[16/10]' : 'aspect-[4/5]'} bg-[#34302a]`}>
                  <img
                    src={photo.src}
                    alt={photo.title}
                    className="h-full w-full object-cover"
                    loading={index === 0 ? 'eager' : 'lazy'}
                    onError={showFallbackImage}
                  />
                </div>
                <div className="p-5">
                  <p className="text-xs font-bold text-[#d7a29a]">{photo.label}</p>
                  <h3 className="mt-2 text-lg font-bold">{photo.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-white/68">{photo.text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="menu" className="section-pad bg-[#f4eee7]">
        <div className="shell">
          <div className="mb-9 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-bold text-[#9b5d3a]">MENU</p>
              <h2 className="mt-3 text-3xl font-bold md:text-5xl">メニュー</h2>
            </div>
            <p className="max-w-md text-sm leading-7 text-[#6f6760]">表示価格は税込です。初回はカウンセリング時間を含めて余裕を持ってご案内します。</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {services.map((service) => (
              <article key={service.name} className="rounded-lg border border-[#e7ddd3] bg-white p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold">{service.name}</h3>
                    <p className="mt-3 text-sm leading-7 text-[#6f6760]">{service.text}</p>
                  </div>
                  <Sparkles className="h-5 w-5 shrink-0 text-[#d7a29a]" />
                </div>
                <div className="mt-6 flex flex-wrap gap-2 text-sm font-bold">
                  <span className="rounded-md bg-[#f4eee7] px-3 py-2">{service.time}</span>
                  {service.price && (
                    <span className="rounded-md bg-[#edf1ea] px-3 py-2">{service.price}</span>
                  )}
                </div>
                {service.plans && (
                  <div className="mt-5 grid gap-2 text-sm sm:grid-cols-3">
                    {service.plans.map((plan) => (
                      <div key={plan.label} className="rounded-md border border-[#e7ddd3] bg-[#fffdf9] px-3 py-3">
                        <p className="font-bold text-[#4b433c]">{plan.label}</p>
                        <p className="mt-1 font-bold text-[#9b5d3a]">{plan.price}</p>
                      </div>
                    ))}
                  </div>
                )}
                {service.features && (
                  <div className="mt-5 rounded-lg border border-[#e7ddd3] bg-[#fffdf9] p-4">
                    <p className="text-xs font-bold text-[#9b5d3a]">MEN'S CARE</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {service.features.map((feature) => (
                        <span key={feature} className="rounded-md bg-white px-3 py-2 text-sm font-bold text-[#4b433c]">
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="reserve" className="section-pad bg-[#fffdf9]">
        <div className="shell grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <aside className="rounded-lg bg-[#24211d] p-7 text-white">
            <p className="text-sm font-bold text-[#d7a29a]">RESERVATION</p>
            <h2 className="mt-3 text-3xl font-bold leading-tight md:text-4xl">予約リクエスト</h2>
            <p className="mt-5 leading-8 text-white/78">
              ご希望日時を送信後、サロン側で空き状況を確認して確定連絡をします。お支払いは来店時の現地決済です。
            </p>
            <div className="mt-8 grid gap-4 text-sm">
              <p className="flex items-center gap-3"><Clock3 className="h-5 w-5 text-[#d7a29a]" /> 営業時間 10:00-20:00</p>
              <p className="flex items-center gap-3"><UserRoundCheck className="h-5 w-5 text-[#d7a29a]" /> 完全予約制・女性スタッフ対応</p>
              <p className="flex items-center gap-3"><MessageCircle className="h-5 w-5 text-[#d7a29a]" /> 予約確定はメールまたは電話で連絡</p>
            </div>
          </aside>

          <form onSubmit={submitReservation} className="rounded-lg border border-[#e7ddd3] bg-white p-5 shadow-sm md:p-7">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="field-label">
                お名前
                <input required className="field" name="name" value={form.name} onChange={updateForm} autoComplete="name" />
              </label>
              <label className="field-label">
                フリガナ
                <input required className="field" name="kana" value={form.kana} onChange={updateForm} />
              </label>
              <label className="field-label">
                電話番号
                <input required className="field" name="phone" value={form.phone} onChange={updateForm} autoComplete="tel" inputMode="tel" />
              </label>
              <label className="field-label">
                メール
                <input required className="field" type="email" name="email" value={form.email} onChange={updateForm} autoComplete="email" />
              </label>
              <label className="field-label">
                メニュー
                <select className="field" name="service" value={form.service} onChange={updateForm}>
                  {serviceOptions.map((service) => <option key={service}>{service}</option>)}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="field-label">
                  希望日
                  <input required className="field" type="date" name="date" value={form.date} min={minDate} onChange={updateForm} />
                </label>
                <label className="field-label">
                  時間
                  <select className="field" name="time" value={form.time} onChange={updateForm}>
                    {timeSlots.map((slot) => (
                      <option key={slot} value={slot} disabled={bookedTimes.includes(slot)}>
                        {bookedTimes.includes(slot) ? `${slot} 予約済み` : slot}
                      </option>
                    ))}
                  </select>
                  {form.date && availabilityStatus === 'ready' && bookedTimes.length > 0 && (
                    <span className="text-xs font-bold text-[#9b5d3a]">予約済みの時間は選択できません。</span>
                  )}
                  {form.date && availabilityStatus === 'error' && (
                    <span className="text-xs font-bold text-red-700">空き状況を取得できませんでした。</span>
                  )}
                </label>
              </div>
              <label className="field-label md:col-span-2">
                相談内容
                <textarea className="field min-h-28 resize-y" name="note" value={form.note} onChange={updateForm} placeholder="気になる部位、肌の不安、来店前に確認したいことなど" />
              </label>
            </div>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs leading-5 text-[#6f6760]">送信時点では仮予約です。決済機能は入れていません。</p>
              <button className="primary-button" type="submit" disabled={status.type === 'loading' || !form.time}>
                <CalendarCheck className="h-4 w-4" />
                {status.type === 'loading' ? '送信中' : '予約を送信'}
              </button>
            </div>
            {status.message && (
              <p className={`mt-4 rounded-md px-4 py-3 text-sm font-bold ${status.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-[#edf1ea] text-[#40513d]'}`}>
                {status.message}
              </p>
            )}
          </form>
        </div>
      </section>

      <section id="access" className="section-pad bg-[#24211d] text-white">
        <div className="shell grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-sm font-bold text-[#d7a29a]">ACCESS</p>
            <h2 className="mt-3 text-3xl font-bold md:text-5xl">pulito salon</h2>
            <div className="mt-7 grid gap-4 text-white/82">
              <p className="flex gap-3"><MapPin className="mt-1 h-5 w-5 shrink-0 text-[#d7a29a]" /> 〒950-1311 新潟県新潟市南区木滑1510-1</p>
              <p className="flex gap-3"><Phone className="mt-1 h-5 w-5 shrink-0 text-[#d7a29a]" /> 025-375-4238</p>
              <p className="flex gap-3"><Clock3 className="mt-1 h-5 w-5 shrink-0 text-[#d7a29a]" /> 8:00-20:00 / 不定休</p>
              <a
                className="flex gap-3 transition hover:text-[#d7a29a]"
                href="https://www.instagram.com/pulito45/"
                target="_blank"
                rel="noreferrer"
              >
                <Instagram className="mt-1 h-5 w-5 shrink-0 text-[#d7a29a]" />
                Instagram @pulito45
              </a>
            </div>
          </div>
          <div className="overflow-hidden rounded-lg border border-white/14 bg-[#34302a]">
            <iframe
              title="pulito salon Google Map"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2270.3839043800285!2d138.98477317076876!3d37.747112678625534!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x5ff4dd3ef924ff39%3A0xfdf68a740da79bd2!2z44CSOTUwLTEzMTEg5paw5r2f55yM5paw5r2f5biC5Y2X5Yy65pyo5ruR77yR77yV77yQ4oiS77yRIOOBv-OBi-OBr-OBhuOBmQ!5e1!3m2!1sja!2sjp!4v1778404840899!5m2!1sja!2sjp"
              className="h-[360px] w-full border-0 md:h-[450px]"
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>
    </main>
  );
}
