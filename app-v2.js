const API = "/api";

async function loadLinks() {
  try {
    const res = await fetch(API + "/list");
    const data = await res.json();

    const tbody = document.getElementById("list");
    tbody.innerHTML = "";

    data.forEach(item => {
      tbody.innerHTML += `
        <tr>
          <td><a href="/${item.slug}" target="_blank">${item.slug}</a></td>
          <td><a href="${item.original_url}" target="_blank">${item.original_url}</a></td>
          <td><strong id="clicks-${item.slug}" style="color: #10B981;">${item.clicks || 0}</strong></td>
          <td>
            <button onclick="copyLink('${item.slug}')">Copy</button>
            <button onclick="deleteLink('${item.slug}')">Delete</button>
          </td>
        </tr>`;
    });
  } catch (e) {
    console.error("Error loading links:", e);
  }
}

async function loadLiveClicks() {
  try {
    const res = await fetch(API + "/list");
    const data = await res.json();
    
    data.forEach(item => {
      const clickEl = document.getElementById(`clicks-${item.slug}`);
      if (clickEl) {
        const currentClicks = item.clicks || 0;
        if (clickEl.innerText != currentClicks) {
          clickEl.innerText = currentClicks;
          clickEl.style.transform = "scale(1.2)";
          setTimeout(() => {
            clickEl.style.transform = "scale(1)";
          }, 500);
        }
      }
    });
  } catch (e) {}
}

async function createLink() {
  const slug = document.getElementById("slug").value.trim();
  const url = document.getElementById("url").value.trim();

  if (!slug || !url) {
    alert("សូមបំពេញ Slug និង URL!");
    return;
  }

  const res = await fetch(API + "/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slug, url })
  });

  const data = await res.json();
  if (data.success) {
    document.getElementById("slug").value = "";
    document.getElementById("url").value = "";
    loadLinks();
  } else {
    alert(data.error || "Error creating link");
  }
}

function copyLink(slug) {
  const fullUrl = window.location.origin + "/" + slug;
  navigator.clipboard.writeText(fullUrl);
  alert("Copied: " + fullUrl);
}

async function deleteLink(slug) {
  if (!confirm(`តើអ្នកពិតជាចង់លុប ${slug} មែនទេ?`)) return;
  await fetch(API + "/delete/" + slug);
  loadLinks();
}

document.addEventListener("DOMContentLoaded", () => {
  const createBtn = document.getElementById("createBtn");
  if (createBtn) {
    createBtn.addEventListener("click", createLink);
  }
});

loadLinks();
setInterval(loadLiveClicks, 3000);
