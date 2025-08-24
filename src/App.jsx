import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { X, MessageCircle, Search, Plus } from "lucide-react";

// =====================
// 数据源（可替换为完整导出的 JSON）
// =====================
const PEOPLE = [
  {
    id: "p1",
    name: "cc",
    gender: "女",
    city: "上海",
    mbti: "",
    zodiac: "天秤座",
    tags: ["宠物", "音乐", "电影", "阅读", "心理", "做过up主", "支过教", "发表过文章"],
    headline:
      "理学/生物科学类/神经科学。捕捉乍现的创作灵感；扩展同/跨领域的人脉；认识志同道合的朋友",
    intro:
      "我是cc，在上海学术牛马。背景是理学/生物科学类/神经科学。平时喜欢：宠物、音乐、电影、阅读、心理。上半年让我满意的事：分手，开始崭新的生活。下半年想尝试/突破：拍一部关于学校自然环境的纪录片！正在努力成为一个温柔而坚定的人。",
  },
  {
    id: "p2",
    name: "萝卜",
    gender: "男",
    city: "北京",
    mbti: "ENFP",
    zodiac: "",
    tags: [
      "文学",
      "历史",
      "戏剧",
      "动漫",
      "建筑",
      "电影",
      "阅读",
      "机车",
      "时尚",
      "心理",
      "美食",
      "写过小说",
      "发表过文章",
    ],
    headline: "工学/环境科学与工程类/环境科学。参加定期举办的乐趣活动；认识志同道合的朋友",
    intro:
      "我是萝卜，在北京。背景是工学/环境科学与工程类/环境科学。平时喜欢：文学、历史、戏剧、动漫、建筑、电影、阅读、机车、时尚、心理、美食。上半年让我满意的事：去看了公众号推荐的展览。下半年想尝试/突破：想读一些其他领域没读过的书。",
  },
  {
    id: "p3",
    name: "王一",
    gender: "",
    city: "",
    mbti: "INFP",
    zodiac: "双鱼座",
    tags: [
      "健身",
      "游戏",
      "艺术",
      "音乐",
      "哲学",
      "文学",
      "历史",
      "动漫",
      "摄影",
      "电影",
      "阅读",
      "舞蹈",
      "时尚",
      "表演",
      "心理",
      "美食",
      "solo trip",
      "勇敢做过不被他人理解的选择",
      "发表过文章",
    ],
    headline:
      "法学/公安学类/犯罪学。获得高质的表达机会；捕捉乍现的创作灵感；扩展同/跨领域的人脉；参加定期举办的乐趣活动；认识志同道合的朋友；收获建设性建议/意见",
    intro:
      "我是王一。背景是法学/公安学类/犯罪学。平时喜欢：健身、游戏、艺术、音乐、哲学、文学、历史、动漫、摄影、电影、阅读、舞蹈、时尚、表演、心理、美食。上半年让我满意的事：完成了一项大工作，并认清一些事情。同时身体还比较健康。下半年想尝试/突破：着重在个人层面，做个人选择。我是一个兴趣比较广泛的人，非常想有一些新的信息刺激，同时又需要很多时间消化，非常期待与大家聊天。",
  },
];

// =====================
// 轻量“测试用例”
// 目的：在无测试框架下，提供最基本的数据与渲染断言
// =====================
function runSmokeTests(dataset) {
  const results = [];
  const ok = (cond, msg) => results.push({ pass: !!cond, msg });

  ok(Array.isArray(dataset), "PEOPLE 应为数组");
  ok(dataset.length > 0, "PEOPLE 长度 > 0");
  ok(dataset.every((p) => typeof p.id === "string" && p.id), "每个成员应包含非空 id");
  ok(dataset.every((p) => typeof p.name === "string" && p.name), "每个成员应包含非空 name");
  ok(
    dataset.every((p) => typeof p.intro === "string" && p.intro.length > 5),
    "每个成员应包含合理的 intro 文本"
  );

  // 输出到控制台以便排查
  const failed = results.filter((r) => !r.pass);
  if (failed.length) {
    console.group("[IntroWall Tests] 失败用例");
    failed.forEach((f) => console.error("✖", f.msg));
    console.groupEnd();
  } else {
    console.info("[IntroWall Tests] 所有用例通过 ✔", results.length);
  }
  return { total: results.length, failed: failed.length };
}

// =====================
// 评论存储工具（localStorage）
// =====================
const storageKey = (pid) => `intro-comments:${pid}`;

function useComments(personId) {
  const [comments, setComments] = useState(() => {
    try {
      const raw = localStorage.getItem(storageKey(personId));
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey(personId), JSON.stringify(comments));
    } catch {}
  }, [personId, comments]);

  const add = (c) => setComments((prev) => [{ id: crypto.randomUUID(), ...c }, ...prev]);
  const remove = (id) => setComments((prev) => prev.filter((x) => x.id !== id));

  return { comments, add, remove };
}

// =====================
// UI 片段
// =====================
function TagList({ items }) {
  if (!items?.length) return null;
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {items.map((t) => (
        <Badge key={t} variant="secondary" className="rounded-2xl">
          {t}
        </Badge>
      ))}
    </div>
  );
}

function CommentEditor({ onSubmit }) {
  const [name, setName] = useState("");
  const [text, setText] = useState("");

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <Input
          placeholder="你的名字（可留空）"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <div className="md:col-span-2">
          <Textarea
            placeholder="写下你的想法、鼓励或问题…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-[80px]"
          />
        </div>
      </div>
      <div className="flex justify-end">
        <Button
          onClick={() => {
            if (!text.trim()) return;
            onSubmit({
              name: name.trim() || "匿名",
              text: text.trim(),
              time: new Date().toISOString(),
            });
            setText("");
          }}
        >
          发表评论
        </Button>
      </div>
    </div>
  );
}

function CommentList({ list, onDelete }) {
  if (!list.length) return <p className="text-sm text-muted-foreground">还没有评论，快来抢沙发～</p>;
  return (
    <div className="space-y-3">
      {list.map((c) => (
        <div key={c.id} className="rounded-xl border p-3">
          <div className="flex items-center justify-between">
            <div className="font-medium">
              {c.name}
              <span className="ml-2 text-xs text-muted-foreground">
                {new Date(c.time).toLocaleString()}
              </span>
            </div>
            <Button variant="ghost" size="icon" onClick={() => onDelete(c.id)} aria-label="删除评论">
              <X className="w-4 h-4" />
            </Button>
          </div>
          <p className="mt-1 leading-relaxed whitespace-pre-wrap">{c.text}</p>
        </div>
      ))}
    </div>
  );
}

function PersonCard({ person }) {
  const { comments, add, remove } = useComments(person.id);

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-xl">{person.name}</span>
            <Badge variant="outline">{person.gender || "-"}</Badge>
            {person.city && <Badge variant="secondary">{person.city}</Badge>}
            {person.mbti && <Badge variant="secondary">{person.mbti}</Badge>}
            {person.zodiac && <Badge variant="secondary">{person.zodiac}</Badge>}
          </CardTitle>
          <p className="text-muted-foreground leading-relaxed">{person.headline}</p>
          <TagList items={person.tags} />
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-base leading-7">{person.intro}</p>

          <Separator />

          <div className="flex items-center gap-2 text-sm font-medium">
            <MessageCircle className="w-4 h-4" /> 评论区
          </div>
          <CommentEditor onSubmit={add} />
          <CommentList list={comments} onDelete={remove} />
        </CardContent>
      </Card>
    </motion.div>
  );
}

// =====================
// 顶部：搜索/新增
// =====================
function AddPerson({ onAdd }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", intro: "" });

  const update = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  return (
    <div className="w-full">
      {!open ? (
        <Button onClick={() => setOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> 新增成员（本地临时保存）
        </Button>
      ) : (
        <div className="mt-3 grid gap-2 md:grid-cols-6">
          <Input
            className="md:col-span-2"
            placeholder="昵称 *"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
          />
          <Input
            placeholder="城市"
            value={form.city || ""}
            onChange={(e) => update("city", e.target.value)}
          />
          <Input
            placeholder="MBTI"
            value={form.mbti || ""}
            onChange={(e) => update("mbti", e.target.value)}
          />
          <Input
            placeholder="星座"
            value={form.zodiac || ""}
            onChange={(e) => update("zodiac", e.target.value)}
          />
          <Input
            placeholder="标签（用逗号分隔）"
            value={form.tags || ""}
            onChange={(e) => update("tags", e.target.value)}
          />
          <Textarea
            className="md:col-span-6 min-h-[100px]"
            placeholder="自我介绍（1 段话）*"
            value={form.intro}
            onChange={(e) => update("intro", e.target.value)}
          />
          <div className="md:col-span-6 flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setOpen(false)}>取消</Button>
            <Button
              onClick={() => {
                if (!form.name.trim() || !form.intro.trim()) return;
                const p = {
                  id: crypto.randomUUID(),
                  name: form.name.trim(),
                  gender: form.gender || "-",
                  city: form.city?.trim() || "",
                  mbti: form.mbti?.trim() || "",
                  zodiac: form.zodiac?.trim() || "",
                  tags: (form.tags || "")
                    .split(/[，,]/)
                    .map((s) => s.trim())
                    .filter(Boolean),
                  headline: form.headline?.trim() || "",
                  intro: form.intro.trim(),
                };
                onAdd(p);
                setForm({ name: "", intro: "" });
                setOpen(false);
              }}
            >
              保存到页面
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [people, setPeople] = useState(() => {
    try {
      const raw = localStorage.getItem("intro-people:dataset");
      return raw ? JSON.parse(raw) : PEOPLE;
    } catch {
      return PEOPLE;
    }
  });

  // 运行轻量测试
  const [testInfo, setTestInfo] = useState({ total: 0, failed: 0 });
  useEffect(() => {
    setTestInfo(runSmokeTests(people));
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("intro-people:dataset", JSON.stringify(people));
    } catch {}
  }, [people]);

  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    if (!q.trim()) return people;
    const key = q.trim().toLowerCase();
    return people.filter((p) =>
      [p.name, p.city, p.mbti, p.zodiac, p.headline, p.intro, ...(p.tags || [])]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(key)
    );
  }, [people, q]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      <header className="sticky top-0 z-10 backdrop-blur supports-[backdrop-filter]:bg-white/70 bg-white/90 border-b">
        <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold">社群自我介绍墙</h1>
            <p className="text-sm text-muted-foreground">
              每人一段自我介绍，下面可评论互动（数据保存在浏览器本地）。
            </p>
          </div>
          <div className="flex items-center gap-2 w-full md:w-80">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="搜索昵称 / 城市 / 标签 / 文本…"
            />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <AddPerson onAdd={(p) => setPeople((prev) => [p, ...prev])} />

        <div className="grid gap-6">
          {filtered.map((p) => (
            <PersonCard key={p.id} person={p} />
          ))}
          {!filtered.length && (
            <p className="text-muted-foreground text-sm">没有匹配的成员～换个关键词试试。</p>
          )}
        </div>
      </main>

      <footer className="max-w-5xl mx-auto px-4 py-10 text-xs text-muted-foreground">
        <Separator className="mb-4" />
        <p className="mb-1">
          提示：此页面为前端单页示例，评论与新增成员保存在浏览器 localStorage（仅当前设备可见）。如需真正的多人实时互动，可接入任意后端（Supabase/Firebase/Vercel KV/自建 API）。
        </p>
        <p>测试结果：{testInfo.failed === 0 ? `✔ 全部通过（${testInfo.total} 项）` : `✖ 有 ${testInfo.failed} 项未通过（共 ${testInfo.total} 项）`}</p>
      </footer>
    </div>
  );
}
