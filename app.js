const API = "/api";

async function loadLinks() {
    const res = await fetch(API + "/list");
    const data = await res.json();

    const tbody = document.getElementById("links");
    tbody.innerHTML = "";

    data.forEach(item => {
        tbody.innerHTML += `
        <tr>
            <td>${item.slug}</td>
            <td>${item.original_url}</td>
            <td>
                <button onclick="deleteLink('${item.slug}')">
                    Delete
                </button>
            </td>
        </tr>`;
    });
}

async function createLink() {
    const slug = document.getElementById("slug").value;
    const url = document.getElementById("url").value;

    await fetch(API + "/create", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            slug,
            url
        })
    });

    document.getElementById("slug").value = "";
    document.getElementById("url").value = "";

    loadLinks();
}

async function deleteLink(slug) {
    await fetch(API + "/delete/" + slug, {
        method: "DELETE"
    });

    loadLinks();
}

loadLinks();
