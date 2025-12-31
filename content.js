console.log("Email Writer");

let buttonInjected = false;
let lastInjectionTime = 0;
const INJECTION_DELAY = 2000; // 2 seconds between injections

function getEmailContent(){
    const selectors =['.h7','.a3s.aiL','.gmail_quote','[role="presentation"]'];
    for(const selector of selectors){
        const content = document.querySelector(selector);
        if(content) return content.innerText.trim();
    }
    return '';
}

function findComposeToolbar(){
    const selectors = ['[role="toolbar"]', '.btC', '.T-I-KE', '.aoO', '.v7 .T-I-ax7'];
    for(const selector of selectors){
        const toolbar = document.querySelector(selector);
        if(toolbar && toolbar.querySelector('[role="button"], button')) {
            return toolbar;
        }
    }
    return null;
}


function createAIButton(){
    const button = document.createElement('BUTTON'); // Use <button> not <div>
    button.className = 'T-I J-J5-Ji ao0 v7 T-I-at1 L3 ai-reply-button';
    button.innerHTML = 'AI Reply';
    button.setAttribute('role', 'button');
    button.setAttribute('type', 'button');
    button.setAttribute('tabindex', '0');
    return button;
}


function injectButton(){
    const now = Date.now();
    if(now - lastInjectionTime < INJECTION_DELAY || buttonInjected) {
        return; // Prevent spam
    }
    
    const existingButton = document.querySelector('.ai-reply-button');
    if(existingButton) {
        existingButton.remove();
    }

    const toolbar = findComposeToolbar();
    if(!toolbar){
        console.log("Toolbar not found - waiting...");
        return;
    }
    
    const button = createAIButton();

    toolbar.insertBefore(button, toolbar.firstChild);
    buttonInjected = true;
    lastInjectionTime = now;
    
    console.log("✅ AI Button injected - VISIBLE!");
    
    button.addEventListener('click', async () => {
        try{
            button.innerHTML = 'Generating...';
            button.disabled = true;
            
            const emailContent = getEmailContent();
            const response = await fetch('http://localhost:8080/api/email/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ emailContent, tone: "professional" })
            });

            if(!response.ok) throw new Error(`API failed: ${response.status}`);
            
            const generatedReply = await response.text();
            const composeBox = document.querySelector('[role="textbox"][g_editable="true"]');
            if(composeBox){
                composeBox.focus();
                document.execCommand('insertText', false, generatedReply);
                console.log("✅ Reply inserted!");
            }
        }catch (error) {
            console.error("❌ AI Error:", error);
            button.innerHTML = 'Error';
            setTimeout(() => button.innerHTML = 'AI Reply', 2000);
        } finally {
            setTimeout(() => {
                button.innerHTML = 'AI Reply';
                button.disabled = false;
            }, 1000);
        }
    });
}

// FIXED Observer - Only watches compose dialog
function initObserver() {
    const composeDialog = document.querySelector('[role="dialog"]') || document.body;
    const observer = new MutationObserver((mutations) => {
        // Only react to major changes (compose opening)
        const hasToolbar = mutations.some(mutation => 
            Array.from(mutation.addedNodes).some(node => 
                node.nodeType === 1 && (
                    node.matches?.('[role="toolbar"], .btC, .aoO') ||
                    node.querySelector?.('[role="toolbar"], .btC, .aoO')
                )
            )
        );
        
        if(hasToolbar && !buttonInjected) {
            console.log("🎯 Compose detected - injecting...");
            setTimeout(injectButton, 800);
        }
    });
    
    observer.observe(composeDialog, { 
        childList: true, 
        subtree: true 
    });
    console.log("👀 Observer started");
}

// Initialize when Gmail fully loads
if(document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initObserver);
} else {
    setTimeout(initObserver, 2000);
}

// Initial check
setTimeout(injectButton, 3000);
