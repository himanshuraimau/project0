# How to Add a Blog Post (Simple Guide)

Anyone can add a new blog post by following these 4 steps. No coding experience needed—just copy, paste, and change the words.

---

## What You Need

- The **title** of your blog (e.g. "5 Tips for Better Sleep")
- A **short description** (1–2 sentences) for search engines and previews
- The **date** you want to show (e.g. "20 Feb 2026")
- The **full article** (headings, paragraphs, lists—normal writing)

---

## Step 1: Choose a URL name (slug)

Pick a short, readable name for the URL. Use lowercase letters and hyphens only, no spaces.

**Examples:**
- "5 tips for better sleep" → `5-tips-for-better-sleep`
- "How to study faster" → `how-to-study-faster`

This slug will appear in the link: `yoursite.com/blog/your-slug/`

---

## Step 2: Create a folder and a file

1. Open the project folder on your computer.
2. Go to: **src** → **app** → **blog**
3. **Create a new folder** with the exact name of your slug (e.g. `5-tips-for-better-sleep`)
4. **Inside that folder**, create a new file named: **`page.mdx`**

So you will have:
```
src/app/blog/5-tips-for-better-sleep/page.mdx
```

---

## Step 3: Paste the template and fill it in

Open **`page.mdx`** in a text editor and paste the template below. Then replace only the parts in **CAPS** (and the article body) with your own text.

**Template:**

```mdx
import Image from "next/image";
import { getMetadata, baseUrl } from "@/lib/blog-metadata";
import { renderArticleSchema } from "@/lib/blog-schema";
import { BlogHeader } from "@/components/blog/BlogHeader";
import { authors } from "@/app/blog/data";

export const metadata = getMetadata({
  path: "/blog/YOUR-SLUG-HERE/",
  title: "YOUR TITLE HERE | Flinote",
  description: "YOUR SHORT DESCRIPTION HERE.",
  image: "/logo.png",
  ogType: "article",
});

<>
{renderArticleSchema({
  headline: "YOUR TITLE HERE",
  description: "YOUR SHORT DESCRIPTION HERE.",
  image: "/logo.png",
  author: { name: authors.darshil.name, url: authors.darshil.link },
  datePublished: "YYYY-MM-DD",
  articleUrl: baseUrl + "/blog/YOUR-SLUG-HERE/",
})}

<BlogHeader
  title="YOUR TITLE HERE"
  description="YOUR SHORT DESCRIPTION HERE."
  category="Insights"
  publishedOn="DD Mon YYYY"
/>

<Image
  src="/logo.png"
  alt="YOUR TITLE HERE"
  width={1200}
  height={630}
  className="w-full aspect-video object-cover rounded-lg border border-border mb-8"
/>

## Your first heading

Your first paragraph goes here.

## Another heading

More paragraphs, **bold**, *italic*, and lists:

- Item one
- Item two

[Link to blog list](/blog/)
</>
```

**What to replace:**

| Replace this           | With your own example                          |
|------------------------|------------------------------------------------|
| `YOUR-SLUG-HERE`       | `5-tips-for-better-sleep` (same as folder name) |
| `YOUR TITLE HERE`      | 5 Tips for Better Sleep                        |
| `YOUR SHORT DESCRIPTION HERE.` | One or two sentences that describe the post. |
| `YYYY-MM-DD`           | `2026-02-20` (year-month-day)                  |
| `DD Mon YYYY`          | `20 Feb 2026` (how the date is shown to readers) |
| The headings and text after the Image block | Your real article content        |

**Important:** Do **not** change the first 5 lines (imports), the `category="Insights"` (unless you use "Interview Questions"), or the `authors.darshil` part. Only change the title, description, dates, slug, and the article text.

---

## Step 4: Register the post in the list

So your post appears on the blog listing page:

1. Open the file: **src/app/blog/data.ts**
2. Find the line that says `export const blogs: Blog[] = [`
3. **Add a new block** at the **top** of the list (so the newest post shows first), using this pattern:

```ts
{
  title: "Your exact title here",
  slug: "your-slug-here",
  category: "Insights",
  author: "darshil",
  publishedOn: "20 Feb 2026",
  image: defaultCoverImage,
},
```

4. Replace:
   - **title** → same as the title in your `page.mdx`
   - **slug** → same as your folder name (e.g. `5-tips-for-better-sleep`)
   - **publishedOn** → same date as in `page.mdx` (e.g. `"20 Feb 2026"`)

5. Save the file.

**Example:** If you added a post "5 Tips for Better Sleep" in folder `5-tips-for-better-sleep`, the start of `blogs` could look like:

```ts
export const blogs: Blog[] = [
  {
    title: "5 Tips for Better Sleep",
    slug: "5-tips-for-better-sleep",
    category: "Insights",
    author: "darshil",
    publishedOn: "20 Feb 2026",
    image: defaultCoverImage,
  },
  {
    title: "Study Tips for 2026",
    slug: "study-tips-2026",
    // ... rest of existing posts
  },
];
```

---

## You’re done

- Your post will show on the main blog page: **/blog/**
- The direct link will be: **/blog/your-slug/**

---

## Optional: Add a cover image

1. Add an image file (e.g. `cover.jpg`) **inside your post folder** (same folder as `page.mdx`).
2. In **data.ts**, at the top, add a line like:
   ```ts
   import MyPostCover from "@/app/blog/5-tips-for-better-sleep/cover.jpg";
   ```
3. In the same post’s block in `blogs`, change `image: defaultCoverImage` to `image: MyPostCover`.
4. In **page.mdx**, you can then use that image (e.g. replace `"/logo.png"` with the imported cover) if you want it to show as the post’s main image.

If you skip this, the post will use the default image (logo) and still work.

---

## Quick checklist

- [ ] New folder: `src/app/blog/YOUR-SLUG/`
- [ ] New file: `page.mdx` inside that folder
- [ ] Replaced all YOUR-SLUG-HERE, title, description, dates, and article text in the template
- [ ] Added one new block in `src/app/blog/data.ts` with the same title, slug, and date
- [ ] Saved both files

If something doesn’t work, check that the **slug** is exactly the same in: folder name, `path` in metadata, `articleUrl`, and the `slug` in `data.ts`.
