import { useMemo, useState } from "react";
import styles from "./page.module.css";

type GateType = "add" | "multiply";

type Gate = {
  label: string;
  effect: number;
  type: GateType;
  accent: string;
  description: string;
};

type GateSegment = {
  left: Gate;
  right: Gate;
};

type GrowthLevel = {
  id: number;
  name: string;
  baseSize: number;
  targetSize: number;
  mood: string;
  color: string;
  gateSegments: GateSegment[];
};

const gateLevels: GrowthLevel[] = [
  {
    id: 1,
    name: "Гонки-близнецы",
    baseSize: 10,
    targetSize: 22,
    mood: "Лёгкий разогрев перед серьёзными испытаниями",
    color: "#4c97ff",
    gateSegments: [
      {
        left: {
          label: "-6",
          effect: -6,
          type: "add",
          accent: "#ff6b6b",
          description: "Обрезаем лишний вес, рискованно но быстро",
        },
        right: {
          label: "+6",
          effect: 6,
          type: "add",
          accent: "#00c48c",
          description: "Добавляем мощность без лишних манёвров",
        },
      },
      {
        left: {
          label: "×2",
          effect: 2,
          type: "multiply",
          accent: "#ffb400",
          description: "Магический ускоритель, который вдохновил картинку",
        },
        right: {
          label: "+4",
          effect: 4,
          type: "add",
          accent: "#4be1ec",
          description: "Небольшое усиление для стабильной победы",
        },
      },
    ],
  },
  {
    id: 2,
    name: "Спиральные прыжки",
    baseSize: 12,
    targetSize: 30,
    mood: "Сложнее: силовая комбинация с риском обвала",
    color: "#8e6cff",
    gateSegments: [
      {
        left: {
          label: "×1.5",
          effect: 1.5,
          type: "multiply",
          accent: "#ff8dd1",
          description: "Чуть умножили — проверяем стабильность",
        },
        right: {
          label: "+10",
          effect: 10,
          type: "add",
          accent: "#7cf29c",
          description: "Жирный бонус на прямой",
        },
      },
      {
        left: {
          label: "-8",
          effect: -8,
          type: "add",
          accent: "#fd7b38",
          description: "Препятствие: потеря массы перед трамплином",
        },
        right: {
          label: "×1.8",
          effect: 1.8,
          type: "multiply",
          accent: "#21d4fd",
          description: "Рискнём ради зрелищного финала",
        },
      },
    ],
  },
  {
    id: 3,
    name: "Айсберг арена",
    baseSize: 16,
    targetSize: 34,
    mood: "Тактический пазл с отрицательными воротами",
    color: "#23b5d3",
    gateSegments: [
      {
        left: {
          label: "-4",
          effect: -4,
          type: "add",
          accent: "#ff5c8a",
          description: "Лёд стягивает силу — нужно компенсировать позже",
        },
        right: {
          label: "×1.6",
          effect: 1.6,
          type: "multiply",
          accent: "#00d5ff",
          description: "Разгоняемся с помощью катапульты",
        },
      },
      {
        left: {
          label: "+14",
          effect: 14,
          type: "add",
          accent: "#9cff00",
          description: "Награда за точный прыжок",
        },
        right: {
          label: "×1.3",
          effect: 1.3,
          type: "multiply",
          accent: "#ffd93d",
          description: "Стабильный множитель для финального рывка",
        },
      },
    ],
  },
];

const favoriteGames = [
  {
    title: "Липкий мост",
    description:
      "Бросаем тесто, чтобы слепить мост и перепрыгнуть пропасть. Чем точнее броски, тем быстрее откроется новый остров!",
    accent: "#f97316",
    tags: ["аркада", "физика", "точность"],
  },
  {
    title: "Катящийся дракон",
    description:
      "Змейка-дракон ползёт по неону, собирает сегменты и обгоняет соперников. Каждый поворот — шанс растянуть тело ещё дальше.",
    accent: "#22d3ee",
    tags: ["стратегия", "реакция", "ритм"],
  },
];

function applyGate(current: number, gate: Gate) {
  if (gate.type === "add") return current + gate.effect;
  return Math.round(current * gate.effect * 10) / 10;
}

function buildTimeline(level: GrowthLevel, choices: ("left" | "right")[]) {
  const steps: number[] = [level.baseSize];
  level.gateSegments.forEach((segment, index) => {
    const gate = choices[index] === "left" ? segment.left : segment.right;
    const nextValue = applyGate(steps[steps.length - 1], gate);
    steps.push(nextValue);
  });
  return steps;
}

export default function Home() {
  const [paths, setPaths] = useState<Record<number, ("left" | "right")[]>>(() =>
    Object.fromEntries(
      gateLevels.map((level) => [
        level.id,
        level.gateSegments.map(() => "right" as const),
      ]),
    ),
  );

  const featured = useMemo(() => gateLevels[0], []);

  const handleChoice = (
    levelId: number,
    segmentIndex: number,
    side: "left" | "right",
  ) => {
    setPaths((prev) => {
      const current = prev[levelId] ?? [];
      const updated = current.map((value, idx) =>
        idx === segmentIndex ? side : value,
      );
      return { ...prev, [levelId]: updated };
    });
  };

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <p className={styles.overline}>Новая фича • Рост персонажей</p>
            <h1>
              Аркады, которые ощущаются как на скриншоте — с воротами на «−6» и
              «×2»
            </h1>
            <p className={styles.lede}>
              Добавили ещё одну игру в стиле бегунков: персонаж растёт,
              сбрасывает вес, а в конце по размеру решается, станет ли он
              победителем. Каждая связка ворот даёт выбор — по красной или
              зелёной дорожке, всё как на популярной картинке.
            </p>
            <div className={styles.heroBadges}>
              <span className={styles.badge}>12 уникальных ворот</span>
              <span className={styles.badge}>3 уровня сложности</span>
              <span className={styles.badge}>Финал с проверкой победы</span>
            </div>
          </div>
          <div className={styles.heroCard}>
            <p className={styles.heroTitle}>Featured run</p>
            <div className={styles.track}>
              {featured.gateSegments.map((segment) => (
                <div
                  key={segment.left.label + segment.right.label}
                  className={styles.segment}
                >
                  <div className={styles.gateRow}>
                    <span
                      className={styles.gateLabel}
                      style={{ backgroundColor: segment.left.accent }}
                    >
                      {segment.left.label}
                    </span>
                    <span className={styles.separator}>vs</span>
                    <span
                      className={styles.gateLabel}
                      style={{ backgroundColor: segment.right.accent }}
                    >
                      {segment.right.label}
                    </span>
                  </div>
                  <p className={styles.segmentHint}>
                    {segment.left.description}
                  </p>
                </div>
              ))}
            </div>
            <div className={styles.heroFooter}>
              <span className={styles.heroStat}>
                Старт: {featured.baseSize} см
              </span>
              <span className={styles.heroStat}>
                Цель: {featured.targetSize} см
              </span>
            </div>
          </div>
        </section>

        <section className={styles.grid}>
          {favoriteGames.map((game) => (
            <article
              key={game.title}
              className={styles.card}
              style={{ borderColor: game.accent }}
            >
              <div className={styles.cardHeader}>
                <div
                  className={styles.dot}
                  style={{ background: game.accent }}
                />
                <h2>{game.title}</h2>
              </div>
              <p className={styles.cardText}>{game.description}</p>
              <div className={styles.tagRow}>
                {game.tags.map((tag) => (
                  <span key={tag} className={styles.tag}>
                    {tag}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </section>

        <section className={styles.levels}>
          <div className={styles.sectionHeader}>
            <p className={styles.overline}>Новая игра</p>
            <h2>Гейтраннер: выбирай дорожку, набирай массу, побеждай</h2>
            <p className={styles.sectionText}>
              Здесь каждая пара ворот работает как та самая сцена: слева «−6»,
              справа «+6», затем магическое «×2». Мы добавили несколько уровней,
              чтобы было, где потренироваться, а в конце — чёткое решение,
              становится ли герой чемпионом.
            </p>
          </div>

          <div className={styles.levelGrid}>
            {gateLevels.map((level) => {
              const choices = paths[level.id] ?? [];
              const timeline = buildTimeline(level, choices);
              const result = timeline[timeline.length - 1];
              const isWinner = result >= level.targetSize;

              return (
                <article
                  key={level.id}
                  className={styles.levelCard}
                  style={{ borderColor: level.color }}
                >
                  <header className={styles.levelHeader}>
                    <div>
                      <p className={styles.overline}>Уровень {level.id}</p>
                      <h3>{level.name}</h3>
                      <p className={styles.mood}>{level.mood}</p>
                    </div>
                    <div className={styles.meter}>
                      <span>Цель</span>
                      <strong>{level.targetSize} см</strong>
                    </div>
                  </header>

                  <div className={styles.timeline}>
                    {timeline.map((value, idx) => (
                      <div
                        key={value + idx.toString()}
                        className={styles.timelineStep}
                      >
                        <div className={styles.timelineDot} />
                        <span className={styles.timelineValue}>{value} см</span>
                        {idx < timeline.length - 1 && (
                          <div className={styles.timelineLine} />
                        )}
                      </div>
                    ))}
                  </div>

                  <div className={styles.gateGrid}>
                    {level.gateSegments.map((segment, segmentIndex) => (
                      <div
                        key={`${level.id}-${segment.left.label}-${segment.right.label}`}
                        className={styles.gateColumn}
                      >
                        <p className={styles.gateTitle}>
                          Выбор #{segmentIndex + 1}
                        </p>
                        {["left", "right"].map((side) => {
                          const gate =
                            side === "left" ? segment.left : segment.right;
                          const selected = choices[segmentIndex] === side;

                          return (
                            <button
                              key={side}
                              type="button"
                              className={`${styles.gateButton} ${selected ? styles.gateButtonActive : ""}`}
                              style={{
                                borderColor: gate.accent,
                                background: selected
                                  ? `${gate.accent}20`
                                  : "transparent",
                              }}
                              onClick={() =>
                                handleChoice(
                                  level.id,
                                  segmentIndex,
                                  side as "left" | "right",
                                )
                              }
                            >
                              <span
                                className={styles.gatePill}
                                style={{ background: gate.accent }}
                              >
                                {gate.label}
                              </span>
                              <div className={styles.gateInfo}>
                                <strong>
                                  {gate.type === "add"
                                    ? "Добавление"
                                    : "Множитель"}
                                </strong>
                                <p>{gate.description}</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>

                  <footer className={styles.levelFooter}>
                    <div>
                      <p className={styles.overline}>Финальный размер</p>
                      <h4>
                        {result} см
                        <span className={styles.target}>
                          {" "}
                          • нужно {level.targetSize} см
                        </span>
                      </h4>
                    </div>
                    <span
                      className={`${styles.badge} ${isWinner ? styles.badgeWin : styles.badgeLose}`}
                    >
                      {isWinner ? "Победитель" : "Не хватает роста"}
                    </span>
                  </footer>
                </article>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
