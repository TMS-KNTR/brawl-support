export default function ServiceLineup() {
  const strengths = [
    {
      title: 'SECURE',
      subtitle: '安全な取引',
      desc: 'クレジットカード・PayPayに対応。エスクロー方式で代行完了まで代金は安全に保全。万が一の場合も全額返金保証。',
      icon: 'ri-shield-check-line',
    },
    {
      title: 'ANONYMOUS',
      subtitle: '完全匿名チャット',
      desc: '個人情報を一切公開せずにやり取り可能。アカウント引き継ぎも専用チャットで安全に行えます。',
      icon: 'ri-chat-private-line',
    },
  ];

  const subStrengths = [
    {
      title: 'プロによる確実な代行',
      desc: '厳正な審査を通過したトッププレイヤーのみが在籍。高い成功率を維持。',
      icon: 'ri-star-line',
    },
    {
      title: '複数タイトル対応',
      desc: '様々なゲームタイトルに対応。対応ゲームは順次拡大中。',
      icon: 'ri-gamepad-line',
    },
  ];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-14">
          <div className="inline-block px-5 py-1.5 border border-[#5B3AE8]/20 rounded-full mb-6">
            <span
              className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#5B3AE8]"
              style={{ fontFamily: '"Orbitron", sans-serif' }}
            >
              GEMSUKEの強み
            </span>
          </div>
        </div>

        {/* Two large cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {strengths.map((s, i) => (
            <div
              key={i}
              className="group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-500"
              style={{ background: 'linear-gradient(135deg, #0E0E20 0%, #141428 50%, #0E0E20 100%)' }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#5B3AE8]/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#5B3AE8]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="relative p-8 sm:p-10 min-h-[240px] flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 border border-[#2A2A45] rounded-lg flex items-center justify-center mb-6 group-hover:border-[#5B3AE8]/30 transition-colors duration-300">
                    <i className={`${s.icon} text-xl text-[#8B7AFF]`}></i>
                  </div>
                  <h3
                    className="text-2xl sm:text-3xl font-extrabold text-white tracking-wider mb-1"
                    style={{ fontFamily: '"Orbitron", sans-serif' }}
                  >
                    {s.title}
                  </h3>
                  <p className="text-[13px] text-[#8B7AFF] font-bold tracking-wide mb-4">{s.subtitle}</p>
                </div>
                <p className="text-[13px] text-[#606080] leading-relaxed font-medium max-w-sm">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Sub rows */}
        <div className="space-y-[2px]">
          {subStrengths.map((s, i) => (
            <div
              key={i}
              className="group flex items-center justify-between px-8 py-5 rounded-xl cursor-pointer transition-all duration-300 hover:bg-[#0F0F22]"
              style={{ background: 'linear-gradient(90deg, #0C0C1A 0%, #0E0E20 100%)' }}
            >
              <div className="flex items-center gap-5">
                <div className="w-9 h-9 border border-[#2A2A45] rounded flex items-center justify-center group-hover:border-[#5B3AE8]/30 transition-colors duration-300">
                  <i className={`${s.icon} text-base text-[#606080] group-hover:text-[#8B7AFF] transition-colors duration-300`}></i>
                </div>
                <span className="text-[14px] font-bold text-[#A0A0B8] group-hover:text-white transition-colors duration-300 tracking-wide">
                  {s.title}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="hidden sm:block text-[12px] text-[#404060] font-medium">{s.desc}</span>
                <i className="ri-arrow-right-s-line text-[#404060] group-hover:text-[#8B7AFF] group-hover:translate-x-1 transition-all duration-300"></i>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
