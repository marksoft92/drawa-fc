'use client';

export default function Tabela({
                                 tabela = [],
                                 SectionLabel,
                                 HerbImg,
                                 getFormaColor,
                               }) {
  return (
    <section
      className="mob-pb"
      style={{
        padding: '0 20px 80px',
        background: '#030712',
      }}
    >
      <div
        style={{
          maxWidth: 900,
          margin: '0 auto',
        }}
      >
        <SectionLabel>Tabela Ligowa</SectionLabel>

        <div
          style={{
            fontSize: 12,
            color: '#475569',
            marginTop: 4,
            letterSpacing: '0.1em',
          }}
        >
          Klasa B · Zachodniopomorska IV · Sezon 2025/26
        </div>

        <div
          style={{
            marginTop: 24,
            overflowX: 'auto',
          }}
        >
          <table
            style={{
              width: '100%',
              borderCollapse: 'separate',
              borderSpacing: '0 4px',
            }}
          >
            <thead>
            <tr>
              {[
                '#',
                'Drużyna',
                'M',
                'W',
                'R',
                'P',
                'Bramki',
                'Pkt',
                'Forma',
              ].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: '8px 12px',
                    textAlign:
                      h === 'Drużyna'
                        ? 'left'
                        : 'center',
                    fontSize: 10,
                    color: '#475569',
                    letterSpacing: '0.15em',
                    fontWeight: 600,
                    borderBottom:
                      '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
            </thead>

            <tbody>
            {tabela.map((row, i) => {
              const isDrawa = row.nazwa
                .toLowerCase()
                .includes('drawa');

              return (
                <tr
                  key={i}
                  style={{
                    background: isDrawa
                      ? 'linear-gradient(90deg, rgba(59,130,246,0.12), rgba(59,130,246,0.04))'
                      : i % 2 === 0
                        ? 'rgba(255,255,255,0.02)'
                        : 'transparent',
                    transition:
                      'background 0.2s',
                  }}
                >
                  {/* Position */}
                  <td
                    style={{
                      padding:
                        '12px 12px',
                      textAlign:
                        'center',
                    }}
                  >
											<span
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius:
                            '50%',
                          background:
                            isDrawa
                              ? '#3b82f6'
                              : parseInt(
                                row.pozycja
                              ) <=
                              2
                                ? 'rgba(59,130,246,0.2)'
                                : 'transparent',
                          border:
                            isDrawa
                              ? 'none'
                              : '1px solid rgba(255,255,255,0.08)',
                          color:
                            isDrawa
                              ? '#fff'
                              : '#64748b',
                          display:
                            'inline-flex',
                          alignItems:
                            'center',
                          justifyContent:
                            'center',
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
												{row.pozycja}
											</span>
                  </td>

                  {/* Team */}
                  <td
                    style={{
                      padding: '12px',
                      minWidth: 140,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems:
                          'center',
                        gap: 10,
                      }}
                    >
                      <HerbImg
                        src={
                          row.herb
                        }
                        alt={
                          row.nazwa
                        }
                        size={24}
                      />

                      <span
                        style={{
                          fontSize: 14,
                          fontWeight:
                            isDrawa
                              ? 700
                              : 400,
                          color:
                            isDrawa
                              ? '#fff'
                              : '#94a3b8',
                        }}
                      >
													{row.nazwa}
												</span>
                    </div>
                  </td>

                  {/* Stats */}
                  {[
                    row.mecze,
                    row.wygrane,
                    row.remisy,
                    row.przegrane,
                    row.bramki,
                  ].map((v, j) => (
                    <td
                      key={j}
                      style={{
                        padding:
                          '12px',
                        textAlign:
                          'center',
                        fontSize: 13,
                        color:
                          isDrawa
                            ? '#cbd5e1'
                            : '#64748b',
                      }}
                    >
                      {v}
                    </td>
                  ))}

                  {/* Points */}
                  <td
                    style={{
                      padding:
                        '12px',
                      textAlign:
                        'center',
                      fontSize: 16,
                      fontWeight: 800,
                      color:
                        isDrawa
                          ? '#3b82f6'
                          : '#94a3b8',
                      fontFamily:
                        "'Bebas Neue', Impact, sans-serif",
                    }}
                  >
                    {row.pkt}
                  </td>

                  {/* Form */}
                  <td
                    style={{
                      padding:
                        '12px 8px',
                      textAlign:
                        'center',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        gap: 3,
                        justifyContent:
                          'center',
                      }}
                    >
                      {row.forma
                        .replace(
                          '?',
                          ''
                        )
                        .split('')
                        .slice(
                          0,
                          5
                        )
                        .map(
                          (
                            f,
                            j
                          ) => (
                            <span
                              key={
                                j
                              }
                              style={{
                                width: 18,
                                height: 18,
                                borderRadius: 4,
                                background:
                                  getFormaColor(
                                    f
                                  ),
                                display:
                                  'inline-flex',
                                alignItems:
                                  'center',
                                justifyContent:
                                  'center',
                                fontSize: 9,
                                fontWeight: 700,
                                color: '#fff',
                              }}
                            >
																{
                                  f
                                }
															</span>
                          )
                        )}
                    </div>
                  </td>
                </tr>
              );
            })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}