<script>
  import Summary from "./Summary.svelte";

  const PAGE_SIZE = 20;

  export let page;

  let items;
  let offset;

  $: fetch(`https://node-hnapi.herokuapp.com/news?page=${page}`)
    .then((r) => r.json())
    .then((data) => {
      items = data;
      offset = PAGE_SIZE * (page - 1);
      window.scrollTo(0, 0);
    });
</script>

{#if items}
  <h1>Dev News List</h1>
  {#each items as item, i}
    <Summary {item} {i} {offset} />
  {/each}
  <div class="pageNums">
    {#if page - 1 > 1 ? page - 1 : 1 !== page}
      <a href="#/top/{page - 1 > 1 ? page - 1 : 1}"
        >{page - 1 > 1 ? page - 1 : 1}</a
      >
    {/if}
    <div class="curPageNum">{page}</div>
    <a href="#/top/{page + 1}">{page + 1}</a>
  </div>
{:else}
  <p class="loading">loading...</p>
{/if}

<style>
  a {
    padding: 1em;
    display: block;
  }
  .curPageNum {
    text-align: center;
    padding: 1em;
  }
  .pageNums {
    display: flex;
    align-items: center;
  }
  .loading {
    opacity: 0;
    animation: 0.4s 0.8s forwards fade-in;
  }

  @keyframes fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
</style>
