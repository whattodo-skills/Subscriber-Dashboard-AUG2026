// API Reference: https://www.wix.com/velo/reference/api-overview/introduction
// “Hello, World!” Example: https://learn-code.wix.com/en/article/hello-world

$w.onReady(function () {
    // Ensure the FAQ widget iframe is visible
    if ($w('#faqWidget1').hidden) {
        $w('#faqWidget1').show();
    }

    // Additional logic can be added here if needed
});
