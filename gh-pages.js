var ghpages = require("gh-pages");

ghpages.publish(
  "public", // path to public directory
  {
    branch: "gh-pages",
    repo: "https://github.com/hanhyeonkyu/svelte-news.git", // Update to point to your repository
    user: {
      name: "hanhyeonkyu", // update to use your name
      email: "busgod1212@gmail.com", // Update to use your email
    },
  },
  () => {
    console.log("Deploy Complete!");
  }
);
