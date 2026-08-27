# WillYouDateMe

A heart-shaped post-it that asks one question. The **No** button will not let
itself be pressed — it scoots away from the cursor, or from your finger. **Yes**
opens a card: the nickname, a note back, a day, a time — and confirming sets off
a bloom of flowers and hearts and sends the plan by email.

One page, no build step to *host*, no server, no dependencies beyond two CDN
tags (Google Fonts and EmailJS). Works on phones.

## Run it

Double-click `index.html`. That's it — nothing is fetched at runtime any more,
so the disk, GitHub Pages and the custom domain all behave identically.

## Hosting

It lives at **https://willyoudateme.simohakim.com**. The repository root *is*
the site — no workflow, no build step on the host.

1. Push the repo to GitHub.
2. **Settings → Pages → Source: Deploy from a branch**, branch `main`, folder
   `/ (root)`.
3. The custom domain is already committed in [`CNAME`](CNAME), so Pages picks
   it up on the first deploy.
4. In Cloudflare DNS on `simohakim.com`:

   | Type | Name | Content | Proxy |
   | --- | --- | --- | --- |
   | `CNAME` | `willyoudateme` | `<user>.github.io` | **DNS only** |

   Leave it grey-clouded until GitHub has issued the certificate — a proxied
   record blocks the ACME check and Pages will sit on "certificate pending".
   Once **Enforce HTTPS** is ticked you can turn the orange cloud on; if you
   do, set that hostname's SSL mode to **Full**, or Cloudflare and Pages will
   bounce the request between them.

This is a subdomain, so it is independent of whatever serves the apex —
`simohakim.com` can stay on Cloudflare Pages untouched.

`.nojekyll` is there so Pages serves the files as-is.

## Changing the words

Everything the page says lives in [`content.json`](content.json) — then run
the one build step, which compiles it into the page:

```sh
python3 build.py
```

That refreshes the copy baked into `app.js` (what the page actually reads) and
rebuilds `dist/hey-little-fairy.html`, a single self-contained file you can
send to someone directly.

```json
"note": {
  "lines": [
    "Hey little fairy,",
    "I like spending time with you,",
    "let's go on a date"
  ],
  "signature": "— Simo"
}
```

Each string in `lines` is its own line on the post-it — the last one is set
larger and bolder. Keep it to three or four short lines so it fits the heart.

Also in there: `buttons`, `refusals` (what the No button says as it flees),
`nudges` (the hints under the buttons), `nickname`, `secret`, all the plan-card
labels, the `times` chips, the confirmation screen, and the email settings.

## The nickname gate

Step 1 of the card is mandatory and only one answer gets through:

```json
"nickname": {
  "label": "What nickname did you give me?",
  "answer": "Mo",
  "wrongTitle": "You're not Tati!",
  "wrongBody": "Go away you harlot! Shoo shoo! 😝"
}
```

The comparison is trimmed and case-insensitive, so `mo`, `Mo `, and ` MO` all
pass. Anything else shakes the field and pops the broom.

> This is a charm, not a lock — `answer` sits in the page source like every
> other word here.

## The furniture

`secret` is the fourth activity, and it does not put itself forward: a small
faded screw sits under the time chips, and clicking it opens the chip.

```json
"secret": { "activity": "come build furniture", "sub": "allen key included" }
```

Once it is on, it outranks whatever the time chip called the outing, and it is
what shows up on the receipt and in the email. Clicking it again hands the
label back to the time chip.

## The email

Confirming calls `sendDateRequest()` in [`app.js`](app.js), which posts to
[EmailJS](https://www.emailjs.com) using the same account, service and template
as simohakim.com:

```json
"email": {
  "recipient": "herbrax212@gmail.com",
  "emailjs": {
    "publicKey": "GBk_Bz7_Q8cZU6TcT",
    "serviceId": "service_hzaatpy",
    "templateId": "template_ih5vxot"
  }
}
```

That template takes four fields — `from_name`, `email_id`, `subject`,
`message` — so the date is folded into them, with `to_email` and `reply_to`
sent along in case the template's To field is a variable.

> **Two things to set in the EmailJS dashboard.** The template decides who the
> mail goes *to*; `recipient` above only fills the variables. And **Allowed
> Domains** has to list `willyoudateme.simohakim.com` — it is a different host
> from `simohakim.com` and does not inherit its entry, so until it is added
> every send is rejected in the browser.

To use something else instead, set `email.endpoint` in `content.json` to any
URL that accepts a JSON `POST` — it takes priority over EmailJS. The payload:

```json
{
  "to": "…", "from": "…", "subject": "…", "body": "…",
  "date": "2026-08-29", "time": "18:30",
  "activity": "come build furniture", "nickname": "Mo",
  "message": "…", "sentAt": "…"
}
```

With the ids blank, or the EmailJS CDN blocked, sending falls back to a mock:
it prints the mail to the console and keeps a copy in `localStorage` under
`willyoudateme.outbox`.

## Files

| | |
| --- | --- |
| `index.html` | markup, and the heart's clip path |
| `styles.css` | the night-garden world |
| `app.js` | the fleeing button, the picker, the canvas petals, the mail |
| `content.json` | every word |
| `build.py` | compiles the words in, builds `dist/` |
| `.nojekyll` | tells GitHub Pages to serve the files untouched |
| `CNAME` | the custom domain, read by GitHub Pages |

The sound toggle (top right) is off by default and synthesises its tones with
the Web Audio API, so there are no audio files.
