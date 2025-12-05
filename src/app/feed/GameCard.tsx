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
  Icon28ChevronUpOutline,
  Icon28ChevronDownOutline,
} from "@vkontakte/icons";
import { usePathname, useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { createSwipeDetector, type SwipeDirection } from "@/lib/swipeDetector";
import styles from "./GameCard.module.scss";

type IconComponent = (props: {
  width?: number;
  height?: number;
  className?: string;
}) => JSX.Element;

type ActionButton = {
  label: string;
  Icon: IconComponent;
  variant?: "framed";
};

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

type FooterIcon = {
  label: string;
  Icon: IconComponent;
  href: string;
  badge?: number;
};

const footerIcons: FooterIcon[] = [
  { label: "Дом", Icon: Icon28HomeOutline, href: "/" },
  { label: "Поиск", Icon: Icon28SearchOutline, href: "/search" },
  {
    label: "Сообщения",
    Icon: Icon28MessageOutline,
    href: "/messages",
    badge: 1,
  },
  { label: "Клипы", Icon: Icon28Hand, href: "/clips" },
  { label: "Игры", Icon: Icon28GameOutline, href: "/feed" },
  { label: "Меню", Icon: Icon28MenuOutline, href: "/menu" },
];

const actionButtons: ActionButton[] = [
  { label: "Вверх", Icon: Icon28ChevronUpOutline, variant: "framed" },
  { label: "Вниз", Icon: Icon28ChevronDownOutline, variant: "framed" },
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
  const navGridRef = useRef<HTMLDivElement | null>(null);
  const gameModuleRef = useRef<GameModule | null>(null);
  const isActiveRef = useRef(false);
  const [handlesGameSwipe, setHandlesGameSwipe] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const router = useRouter();
  const pathname = usePathname() || "/";

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

    const stopGame = () => {
      const surface = getSurface();
      try {
        gameModuleRef.current?.stop?.(surface);
      } catch (error) {
        if (error instanceof DOMException && error.name === "NotFoundError") {
          surface?.replaceChildren?.();
        } else {
          console.error("[GameCard] stop failed", error);
        }
      }
      gameModuleRef.current = null;
      setHandlesGameSwipe(false);
    };

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
          stopGame();
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(el);

    return () => {
      destroyed = true;
      observer.disconnect();
      stopGame();
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

  const shouldHandleFooterSwipeStart = useCallback(
    (event: TouchEvent | PointerEvent) => {
      const navEl = navGridRef.current;
      const target = event.target as Node | null;
      if (navEl && target && navEl.contains(target)) {
        return false;
      }
      return true;
    },
    []
  );

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
        shouldHandleStart: shouldHandleFooterSwipeStart,
      }
    );
  }, [shouldHandleFooterSwipeStart, triggerFeedScroll]);

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
        {actionButtons.map(({ Icon, label, variant }, index) => (
          <button
            key={`${label}-${index}`}
            type="button"
            aria-label={label}
            className={`${styles.actionButton} ${
              variant === "framed" ? styles.actionButtonFramed : ""
            }`}
          >
            <Icon width={26} height={26} />
          </button>
        ))}
      </div>

      <div ref={swipeZoneRef} className={styles.footer}>
        <div className={styles.navGrid} ref={navGridRef}>
          {footerIcons.map(({ Icon, label, href, badge }) => {
            const isActive =
              href === "/" ? pathname === "/" : pathname.startsWith(href);

            return (
              <button
                key={label}
                type="button"
                aria-label={label}
                className={styles.navButton}
                onClick={() => router.push(href)}
              >
                <div
                  className={`${styles.navIconWrap} ${
                    isActive ? styles.navIconWrapActive : ""
                  }`}
                >
                  <Icon
                    width={32}
                    height={32}
                    className={`${styles.navIcon} ${
                      isActive ? styles.navIconActive : ""
                    }`}
                  />
                  {badge ? (
                    <span className={styles.navBadge}>{badge}</span>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>

        <div className={styles.pillRow}>
          <div className={styles.pill} />
        </div>
      </div>
    </div>
  );
}
