// src/App.jsx
import React, { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { Search, Send, UserPlus, MapPin, Sparkles } from "lucide-react"
import { supabase } from "./lib/supabase" // 若你暂时还没接 Supabase，可先注释此行

// ===============
// 1) 数据源
// ===============
// 你可以把真实全量数据放到 src/people.js：
//   export const PEOPLE_DATA = [...];
// 然后把下面的 PEOPLE 换成：
//   import { PEOPLE_DATA as PEOPLE } from "./people"
import { PEOPLE_DATA as PEOPLE } from './people'




// ===============
// 2) 工具 & 小组件
// ===============
const hasSupabase =
  Boolean(import.meta?.env?.VITE_SUPABASE_URL) &&
  Boolean(import.meta?.env?.VITE_SUPABASE_ANON_KEY)

function classNames(...xs) {
  return xs.filter(Boolean).join(" ")
}

function Section({ children, className }) {
  return <section className={classNames("max-w-6xl mx-auto px-4", className)}>{children}</section>
}

function Badge({ children }) {
  return (
    <span className="inline-block rounded-full border px-3 py-1 text-xs text-gray-700 bg-white/70 backdrop-blur">
      {children}
    </span>
  )
}

// ===============
// 3) 评论：本地存储（降级）
// ===============
function useCommentsLocal(personId) {
  const key = `comments::${personId}`
  const [comments, setComments] = useState(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  })

  const add = async ({ name, text }) => {
    if (!text?.trim()) return
    const item = {
      id: String(Date.now()) + Math.random(),
      person_id: personId,
      name: name?.trim() || "匿名",
      text: text.trim(),
      created_at: new Date().toISOString(),
      _local: true,
    }
    const next = [item, ...comments]
    setComments(next)
    localStorage.setItem(key, JSON.stringify(next))
  }

  const remove = async (id) => {
    const next = comments.filter((c) => c.id !== id)
    setComments(next)
    localStorage.setItem(key, JSON.stringify(next))
  }

  return { comments, add, remove, loading: false, error: null, isCloud: false }
}

// ===============
// 4) 评论：Supabase 云评论
// ===============
function useCommentsCloud(personId) {
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      const { data, error } = await supabase
        .from("comments")
        .select("*")
        .eq("person_id", personId)
        .order("created_at", { ascending: false })
      if (!cancelled) {
        if (error) setError(error.message)
        else setComments(data || [])
        setLoading(false)
      }
    }
    load()

    // Realtime 订阅：新评论自动加入
    const channel = supabase
      .channel(`comments:${personId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "comments", filter: `person_id=eq.${personId}` },
        (payload) => setComments((prev) => [payload.new, ...prev])
      )
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [personId])

  const add = async ({ name, text }) => {
    if (!text?.trim()) return
    const { error } = await supabase.from("comments").insert({
      person_id: personId,
      name: name?.trim() || "匿名",
      text: text.trim(),
    })
    if (error) throw error
  }

  const remove = async (id) => {
    // 出于安全（RLS），前端默认不开放删除；请在 Supabase 后台操作
    console.warn("删除请在 Supabase 后台进行：", id)
  }

  return { comments, add, remove, loading, error, isCloud: true }
}

// ===============
// 5) 个人卡片
// ===============
function PersonCard({ person }) {
  const [nick, setNick] = useState("")
  const [text, setText] = useState("")
  const [posting, setPosting] = useState(false)

  const commentsApi = hasSupabase ? useCommentsCloud(person.id) : useCommentsLocal(person.id)
  const { comments, add, loading, error, isCloud } = commentsApi

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!text.trim()) return
    try {
      setPosting(true)
      await add({ name: nick, text })
      setText("")
    } catch (err) {
      alert("发布失败：" + (err?.message || String(err)))
    } finally {
      setPosting(false)
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border bg-white/80 backdrop-blur p-5 shadow-sm"
    >
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-400 to-fuchsia-400 flex items-center justify-center text-white font-semibold">
          {person.name?.slice(0, 1) || "友"}
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold">{person.name || "匿名成员"}</h3>
            {person.city && (
              <span className="inline-flex items-center gap-1 text-xs text-gray-600">
                <MapPin className="h-3.5 w-3.5" />
                {person.city}
              </span>
            )}
            {person.mbti && <Badge>{person.mbti}</Badge>}
            {person.zodiac && <Badge>{person.zodiac}</Badge>}
            {person.gender && person.gender !== "-" && <Badge>{person.gender}</Badge>}
          </div>
          {person.headline && <p className="mt-1 text-sm text-gray-700">{person.headline}</p>}
          {person.tags?.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {person.tags.slice(0, 8).map((t, i) => (
                <span key={i} className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-700">
                  #{t}
                </span>
              ))}
            </div>
          )}
          {person.intro && <p className="mt-3 text-[15px] leading-6 text-gray-900">{person.intro}</p>}
        </div>
      </div>

      {/* 评论区 */}
      <div className="mt-4 border-t pt-4">
        <div className="mb-2 flex items-center gap-2 text-xs text-gray-500">
          <Sparkles className="h-3.5 w-3.5" />
          <span>
            评论存储：{isCloud ? "云端（Supabase）" : "仅本机（localStorage）"}
            {loading && " · 正在加载..."}
            {error && ` · 加载失败：${error}`}
          </span>
        </div>

        <form onSubmit={onSubmit} className="flex items-start gap-2">
          <input
            type="text"
            placeholder="你的昵称（可空）"
            className="w-40 rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            value={nick}
            onChange={(e) => setNick(e.target.value)}
          />
          <textarea
            placeholder="写点什么…（Ctrl/⌘+Enter 快速发送）"
            className="flex-1 rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px]"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") onSubmit(e)
            }}
          />
          <button
            type="submit"
            disabled={posting || !text.trim()}
            className={classNames(
              "inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm",
              posting || !text.trim()
                ? "bg-gray-200 text-gray-500"
                : "bg-indigo-600 text-white hover:bg-indigo-500"
            )}
            title={isCloud ? "发送到云端" : "仅保存在本机"}
          >
            <Send className="h-4 w-4" />
            发布
          </button>
        </form>

        <ul className="mt-3 space-y-2">
          {comments.map((c) => (
            <li key={c.id} className="rounded-md border bg-white px-3 py-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{c.name || "匿名"}</span>
                <span className="text-xs text-gray-500">
                  {new Date(c.created_at).toLocaleString()}
                  {c._local ? " · 本机" : ""}
                </span>
              </div>
              <p className="mt-1 text-[15px] leading-6 whitespace-pre-wrap">{c.text}</p>
            </li>
          ))}
          {comments.length === 0 && !loading && (
            <li className="text-sm text-gray-500">还没有评论，来占个沙发吧～</li>
          )}
        </ul>
      </div>
    </motion.div>
  )
}

// ===============
// 6) 顶层应用
// ===============
export default function App() {
  const [query, setQuery] = useState("")
  const [people, setPeople] = useState(PEOPLE)

  // 简单搜索：按名字、城市、标签、正文匹配
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return people
    return people.filter((p) => {
      const hay = [
        p.name,
        p.city,
        p.mbti,
        p.zodiac,
        (p.tags || []).join(" "),
        p.headline,
        p.intro,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
      return hay.includes(q)
    })
  }, [people, query])

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50/60 to-white">
      {/* 顶部 */}
      <header className="sticky top-0 z-10 bg-white/70 backdrop-blur border-b">
        <Section className="flex items-center gap-3 py-3">
          <div className="text-xl font-semibold">设问 · 社群自我介绍墙</div>
          <div className="ml-auto relative w-full max-w-[520px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
            <input
              className="w-full rounded-lg border pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="搜索成员（昵称/城市/标签/正文）"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </Section>
      </header>

      {/* 主区 */}
      <main className="py-6">
        <Section>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filtered.map((p) => (
              <PersonCard key={p.id} person={p} />
            ))}
          </div>

          {/* 简易“自检” */}
          <div className="mt-8 text-xs text-gray-500">
            数据校验：
            {Array.isArray(people) && people.length > 0 && people[0]?.id ? "✔︎ OK" : "✖︎ 空数据"}
            <span className="ml-2">
              {hasSupabase
                ? "评论：云端（Supabase 已配置）"
                : "评论：本机（未检测到 VITE_SUPABASE_*，回退 localStorage）"}
            </span>
          </div>
        </Section>
      </main>

      {/* 页脚 */}
      <footer className="py-8 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} 设问社群 · Intro Wall
      </footer>
    </div>
  )
}
