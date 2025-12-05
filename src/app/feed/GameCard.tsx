"use client";

import {
  Icon28CrownOutline,
  Icon28GameOutline,
  Icon28Hand,
  Icon28HomeOutline,
  Icon28LikeOutline,
  Icon28MenuOutline,
  Icon28MessageOutline,
  Icon28MoreVertical,
  Icon28MuteOutline,
  Icon28SearchOutline,
  Icon28ShareOutline,
  Icon28ThumbsDownOutline,
  Icon28VolumeOutline,
} from "@vkontakte/icons";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { createSwipeDetector, type SwipeDirection } from "@/lib/swipeDetector";
import styles from "./GameCard.module.scss";

export type FeedItem = {
  id: string;
  name: string;
  entry: string;
};

type GameModule = {
  start?: (container: HTMLElement) => void;
  stop?: (container: HTMLElement) => void;
  onSwipe?: (direction: SwipeDirection) => void;
  gameConfig?: {
    handlesSwipe?: boolean;
    swipeDirections?: SwipeDirection[];
  };
};

type Props = {
  item: FeedItem;
  onFeedSwipe: (direction: SwipeDirection, distance: number) => void;
};

type LeaderboardUser = {
  id: string;
  name: string;
  isTop?: boolean;
};

type StyleVars = CSSProperties & {
  "--footer-height"?: string;
};
const FOOTER_HEIGHT = 82;

const footerIcons = [
  { label: "Дом", Icon: Icon28HomeOutline, active: false },
  { label: "Поиск", Icon: Icon28SearchOutline, active: false },
  {
    label: "Сообщения",
    Icon: Icon28MessageOutline,
    active: false,
    badge: 1,
  },
  { label: "Клипы", Icon: Icon28Hand, active: false },
  { label: "Игры", Icon: Icon28GameOutline, active: true },
  { label: "Меню", Icon: Icon28MenuOutline, active: false },
];

const actionButtons = [
  { label: "Лайк", Icon: Icon28LikeOutline },
  { label: "Дизлайк", Icon: Icon28ThumbsDownOutline },
  { label: "Поделиться", Icon: Icon28ShareOutline },
  { label: "Лидеры", Icon: Icon28CrownOutline },
  { label: "Меню", Icon: Icon28MoreVertical },
];

const leaderboardMock: LeaderboardUser[] = [
  { id: "u1", name: "Алексей", isTop: true },
  { id: "u2", name: "Марина" },
  { id: "u3", name: "Илья" },
];

const palette = ["#6fcf97", "#2d9cdb", "#bb6bd9", "#f2994a", "#f25292"];

const getAvatarColor = (id: string, index: number) =>
  palette[(id.length + index) % palette.length];

export default function GameCard({ item, onFeedSwipe }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const gameSurfaceRef = useRef<HTMLDivElement | null>(null);
  const swipeZoneRef = useRef<HTMLDivElement | null>(null);
  const gameModuleRef = useRef<GameModule | null>(null);
  const isActiveRef = useRef(false);
  const [handlesGameSwipe, setHandlesGameSwipe] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const triggerFeedScroll = useCallback(
    (direction: "up" | "down", distance?: number) => {
      const resolvedDistance =
        distance ??
        Math.max(
          ref.current?.clientHeight ?? 0,
          typeof window !== "undefined" ? window.innerHeight : 0,
          120
        );

      onFeedSwipe(direction, resolvedDistance);
    },
    [onFeedSwipe]
  );

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    const getSurface = () => gameSurfaceRef.current ?? el;

    let isRunning = false;
    let destroyed = false;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;

        const visible = entry.isIntersecting;
        isActiveRef.current = visible;

        if (visible && !isRunning) {
          isRunning = true;
          (async () => {
            const entryUrl = new URL(
              item.entry,
              typeof window !== "undefined" ? window.location.origin : ""
            ).toString();
            const module = (await import(
              /* webpackIgnore: true */ entryUrl
            )) as GameModule;
            if (destroyed) return;
            gameModuleRef.current = module;
            setHandlesGameSwipe(Boolean(module.gameConfig?.handlesSwipe));
            module.start?.(getSurface());
          })().catch(() => {
            isRunning = false;
          });
        } else if (!visible && isRunning) {
          isRunning = false;
          gameModuleRef.current?.stop?.(getSurface());
          gameModuleRef.current = null;
          setHandlesGameSwipe(false);
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(el);

    return () => {
      destroyed = true;
      observer.disconnect();
      gameModuleRef.current?.stop?.(getSurface());
      gameModuleRef.current = null;
      setHandlesGameSwipe(false);
      isActiveRef.current = false;
    };
  }, [item.entry]);

  useEffect(() => {
    if (!handlesGameSwipe) return undefined;

    const surface = gameSurfaceRef.current ?? ref.current;
    if (!surface) return undefined;

    return createSwipeDetector(
      surface,
      ({ direction }) => {
        if (!isActiveRef.current) return;
        gameModuleRef.current?.onSwipe?.(direction);
      },
      {
        shouldBlockScroll: () => true,
      }
    );
  }, [handlesGameSwipe]);

  useEffect(() => {
    const swipeZone = swipeZoneRef.current;
    if (!swipeZone) return undefined;

    return createSwipeDetector(
      swipeZone,
      ({ direction, distance }) => {
        if (direction !== "up" && direction !== "down") return;
        triggerFeedScroll(direction, Math.max(distance, 60));
      },
      {
        shouldBlockScroll: () => true,
      }
    );
  }, [triggerFeedScroll]);

  const styleVars: StyleVars = {
    "--footer-height": `${FOOTER_HEIGHT}px`,
  };

  return (
    <div ref={ref} className={styles.container} style={styleVars}>
      <div ref={gameSurfaceRef} className={styles.surface} />

      <div className={styles.infoOverlay}>
        <div className={styles.leaderboard}>
          {leaderboardMock.map((user, index) => (
            <div
              key={user.id}
              className={styles.leaderAvatar}
              style={{ background: getAvatarColor(user.id, index) }}
            >
              {user.name.slice(0, 1)}
              {user.isTop ? (
                <div className={styles.leaderCrown}>
                  <Icon28CrownOutline
                    width={14}
                    height={14}
                    className={styles.crownIcon}
                  />
                </div>
              ) : null}
            </div>
          ))}
        </div>

        <div className={styles.gameCard}>
          <div className={styles.gameAvatar}>{item.name.slice(0, 1)}</div>
          <div className={styles.gameMeta}>
            <div className={styles.gameTitle}>{item.name}</div>
            <div className={styles.audioRow}>
              <button
                onClick={() => setIsMuted((prev) => !prev)}
                aria-label={isMuted ? "Включить звук" : "Выключить звук"}
                className={styles.audioButton}
              >
                {isMuted ? (
                  <Icon28MuteOutline width={20} height={20} />
                ) : (
                  <Icon28VolumeOutline width={20} height={20} />
                )}
              </button>
              <div className={styles.audioLabel}>
                {isMuted ? "Без звука" : "Со звуком"}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.actions}>
        {actionButtons.map(({ Icon, label }, index) => (
          <button
            key={`${label}-${index}`}
            type="button"
            aria-label={label}
            className={styles.actionButton}
          >
            <Icon width={26} height={26} />
          </button>
        ))}
      </div>

      <div ref={swipeZoneRef} className={styles.footer}>
        <div className={styles.navGrid}>
          {footerIcons.map(({ Icon, label, active, badge }) => (
            <button
              key={label}
              type="button"
              aria-label={label}
              className={styles.navButton}
            >
              <div
                className={`${styles.navIconWrap} ${
                  active ? styles.navIconWrapActive : ""
                }`}
              >
                <Icon
                  width={26}
                  height={26}
                  className={`${styles.navIcon} ${
                    active ? styles.navIconActive : ""
                  }`}
                />
                {badge ? (
                  <span className={styles.navBadge}>{badge}</span>
                ) : null}
              </div>
            </button>
          ))}
        </div>

        <div className={styles.pillRow}>
          <div className={styles.pill} />
        </div>
      </div>
    </div>
  );
}
