"use client";

import {
  Icon28ChevronDownOutline,
  Icon28CommentOutline,
  Icon28GameOutline,
  Icon28Hand,
  Icon28HeartCircleOutline,
  Icon28HomeOutline,
  Icon28LikeOutline,
  Icon28MenuOutline,
  Icon28MessageOutline,
  Icon28MoreVertical,
  Icon28Notifications,
  Icon28SearchOutline,
  Icon28ShareOutline,
} from "@vkontakte/icons";
import { usePathname, useRouter } from "next/navigation";
import styles from "@/app/page.module.css";
import feedStyles from "@/app/feed/GameCard.module.scss";

type NavItem = {
  label: string;
  href: string;
  Icon: typeof Icon28HomeOutline;
  badge?: number;
};

const footerNav: NavItem[] = [
  { label: "Дом", href: "/", Icon: Icon28HomeOutline },
  { label: "Поиск", href: "/search", Icon: Icon28SearchOutline },
  {
    label: "Сообщения",
    href: "/messages",
    Icon: Icon28MessageOutline,
    badge: 1,
  },
  { label: "Клипы", href: "/clips", Icon: Icon28Hand },
  { label: "Игры", href: "/feed", Icon: Icon28GameOutline },
  { label: "Меню", href: "/menu", Icon: Icon28MenuOutline },
];

type Story = {
  id: string;
  name: string;
  avatar: string;
  isNew?: boolean;
};

type Post = {
  id: string;
  title: string;
  image: string;
  avatar: string;
  source: string;
  time: string;
  likes: number;
  comments: number;
  shares: number;
};

const stories: Story[] = [
  {
    id: "s1",
    name: "История",
    avatar:
      "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=200&q=80",
    isNew: true,
  },
  {
    id: "s2",
    name: "Айаал",
    avatar:
      "https://images.unsplash.com/photo-1502720705749-3c9255857623?auto=format&fit=crop&w=200&q=80",
    isNew: true,
  },
  {
    id: "s3",
    name: "Максим",
    avatar:
      "https://images.unsplash.com/photo-1472457974886-0ebcd5945550?auto=format&fit=crop&w=200&q=80",
  },
  {
    id: "s4",
    name: "Алексей",
    avatar:
      "https://images.unsplash.com/photo-1500336624523-d727130c3328?auto=format&fit=crop&w=200&q=80",
  },
  {
    id: "s5",
    name: "Дарья",
    avatar:
      "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=200&q=80",
    isNew: true,
  },
];

const posts: Post[] = [
  {
    id: "p1",
    title:
      "Леброн Джеймс заболтался со скамейкой «Финикса», проигрывая 21 очко.",
    image:
      "https://images.unsplash.com/photo-1504457047772-27faf1c00561?auto=format&fit=crop&w=700&q=80",
    avatar:
      "https://images.unsplash.com/photo-1500917293891-ef795e70e1f6?auto=format&fit=crop&w=160&q=80",
    source: "NBA NEWS",
    time: "2 ч назад",
    likes: 94,
    comments: 12,
    shares: 7,
  },
  {
    id: "p2",
    title: "STREAM INSIDE показали сет на фестивале в Берлине.",
    image:
      "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=700&q=80",
    avatar:
      "https://images.unsplash.com/photo-1500336624523-d727130c3328?auto=format&fit=crop&w=160&q=80",
    source: "STREAM INSIDE",
    time: "5 ч назад",
    likes: 62,
    comments: 9,
    shares: 3,
  },
  {
    id: "p3",
    title: "Молодёжная сборная стартовала с победы, идём дальше!",
    image:
      "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=700&q=80",
    avatar:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=160&q=80",
    source: "SPORT TIME",
    time: "8 ч назад",
    likes: 48,
    comments: 14,
    shares: 5,
  },
];

export function HomeMockPage() {
  const pathname = usePathname() || "/";
  const router = useRouter();

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <div className={styles.titleBlock}>
            <div className={styles.titleText}>Главная</div>
            <Icon28ChevronDownOutline width={18} height={18} />
          </div>
          <div className={styles.headerActions}>
            <button className={styles.iconButton} aria-label="Поиск">
              <Icon28SearchOutline width={22} height={22} />
            </button>
            <button className={styles.iconButton} aria-label="Уведомления">
              <Icon28Notifications width={22} height={22} />
            </button>
            <button className={styles.iconButton} aria-label="Профиль">
              <Icon28HeartCircleOutline width={22} height={22} />
            </button>
          </div>
        </header>

        <section className={styles.storiesSection}>
          <div className={styles.storiesRail}>
            {stories.map((story) => (
              <div
                key={story.id}
                className={`${styles.story} ${
                  story.isNew ? styles.storyNew : ""
                }`}
              >
                <div className={styles.storyAvatar}>
                  <img src={story.avatar} alt={story.name} />
                </div>
                <div className={styles.storyName}>{story.name}</div>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.feed}>
          {posts.map((post) => (
            <article key={post.id} className={styles.postCard}>
              <div className={styles.postHeader}>
                <div className={styles.postUser}>
                  <div className={styles.postAvatar}>
                    <img src={post.avatar} alt={post.source} />
                  </div>
                  <div>
                    <div className={styles.postSource}>{post.source}</div>
                    <div className={styles.postMetaLine}>{post.time}</div>
                  </div>
                </div>
                <button className={styles.iconButton} aria-label="Меню записи">
                  <Icon28MoreVertical width={20} height={20} />
                </button>
              </div>
              <div className={styles.postImage}>
                <img src={post.image} alt={post.title} />
              </div>
              <div className={styles.postTitle}>{post.title}</div>
              <div className={styles.postActions}>
                <div className={styles.actionStat}>
                  <Icon28LikeOutline width={22} height={22} />
                  <span>{post.likes}</span>
                </div>
                <div className={styles.actionStat}>
                  <Icon28CommentOutline width={22} height={22} />
                  <span>{post.comments}</span>
                </div>
                <div className={styles.actionStat}>
                  <Icon28ShareOutline width={22} height={22} />
                  <span>{post.shares}</span>
                </div>
              </div>
            </article>
          ))}
        </section>
      </div>

      <div
        className={feedStyles.footer}
        style={{ position: "fixed", left: 0, right: 0, bottom: 0 }}
      >
        <div className={feedStyles.navGrid}>
          {footerNav.map(({ href, label, Icon, badge }) => {
            const isActive =
              href === "/" ? pathname === "/" : pathname.startsWith(href);

            return (
              <button
                key={href}
                type="button"
                aria-label={label}
                className={feedStyles.navButton}
                onClick={() => router.push(href)}
              >
                <div
                  className={`${feedStyles.navIconWrap} ${
                    isActive ? feedStyles.navIconWrapActive : ""
                  }`}
                >
                  <Icon
                    width={32}
                    height={32}
                    className={`${feedStyles.navIcon} ${
                      isActive ? feedStyles.navIconActive : ""
                    }`}
                  />
                  {badge ? (
                    <span className={feedStyles.navBadge}>{badge}</span>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default HomeMockPage;
