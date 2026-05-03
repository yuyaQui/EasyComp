const button_save = document.getElementById("id_save");
const button_add = document.getElementById("id_add");
const text_areas = document.querySelectorAll('textarea');
const text_question = document.querySelector('textarea[name="question"]');
const text_answer = document.querySelector('textarea[name="answer"]');
const text_supplement = document.querySelector('textarea[name="supplement"]');
const text_url = document.querySelector('textarea[name="url"]');
const text_spreadsheet = document.querySelector('textarea[name="spreadsheet"]');
const text_saved = document.querySelector(".savetext");
let button_abled = true;
let savetimer;
let texttimer;

document.addEventListener("DOMContentLoaded", () => {
    chrome.storage.local.get(["question"]).then((result) => {
        text_question.value = result.question;
    })
    chrome.storage.local.get(["answer"]).then((result) => {
        text_answer.value = result.answer;
    })
    chrome.storage.local.get(["supplement"]).then((result) => {
        text_supplement.value = result.supplement;
    })
    chrome.storage.local.get(["url"]).then((result) => {
        text_url.value = result.url;
    });
    chrome.storage.local.get(["spreadsheet"]).then((result) => {
        text_spreadsheet.value = result.spreadsheet;
    });
});

text_areas.forEach(function (el, _) {
    el.addEventListener("keyup", () => {
        clearTimeout(savetimer);
        savetimer = setTimeout(() => {
            ques = text_question.value;
            ans = text_answer.value;
            supple = text_supplement.value;
            link = text_url.value;
            ss = text_spreadsheet.value;
            chrome.storage.local.set({ question: ques });
            chrome.storage.local.set({ answer: ans });
            chrome.storage.local.set({ supplement: supple });
            chrome.storage.local.set({ url: link })
            chrome.storage.local.set({ spreadsheet: ss })
            text_saved.style.display = "inline";
            clearTimeout(texttimer);
            setTimeout(() => {
                text_saved.style.display = '';
            }, 1000);
        }, 500);
    });
});

button_add.addEventListener("click", async () => {
    if (!button_abled) return;
    button_abled = false;
    button_add.value = "送信中"
    await chrome.identity.getAuthToken({ 'interactive': true }, async function (token) {

        const spreadSheetId = text_url.value.split("/")[5];
        const range = "A1:C1";

        const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadSheetId}/values/${range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
        try {
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(
                    {
                        "values": [[text_question.value, text_answer.value, text_supplement.value]]
                    }
                )
            })
            if (response.ok) {
                alert("問題をスプレッドシートに送信しました");
                chrome.storage.local.set({ question: "" });
                chrome.storage.local.set({ answer: "" });
                chrome.storage.local.set({ supplement: "" });
                chrome.storage.local.set({ spreadsheet: "" })
                text_question.value = "";
                text_answer.value = "";
                text_supplement.value = "";
                text_spreadsheet.value = "";
            } else {
                const errorData = await response.json();
                alert(`エラーが発生しました\n・URLは正しいですか？\n・スプレッドシートの編集権限はありますか？\n詳細：${errorData}`);
            }
        } catch (error) {
            console.error(error);
        } finally {
            button_abled = true;
            button_add.value = "追加"
        }
    })
});
