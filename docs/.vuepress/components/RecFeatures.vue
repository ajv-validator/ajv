<template>
  <div>
    <div class="rec" id="less-code">
      <p class="header">Write less code</p>
      <p class="text">Ensure your data is valid once it's received</p>
    </div>

    <div class="rec" id="fast-and-secure">
      <p class="header">Super fast and secure</p>
      <p class="text">The fastest and the most secure JSON validator</p>
    </div>

    <div class="rec" id="multi-spec">
      <p class="header">Multi-specification</p>
      <p class="text">Choose your JSON schema standard</p>
    </div>

    <br class="clearBoth"/>
  </div>
</template>

<style scoped>
  .rec {
    display: inline-block;
    float: left;
    margin: 10px;
    width: 430px;
    height: 300px;
    border-radius: 8px;
  }

  .rec#less-code {
    background: #007BFF;
  }

  .rec#fast-and-secure {
    background: #00A3AA;
  }

  .rec#multi-spec {
    background: #F5775B;
  }

  .header {
    position: relative;
    width: 359px;
    height: 39px;
    left: 30px;
    top: 30px;

    font-family: Heebo;
    font-style: normal;
    font-weight: normal;
    font-size: 36px;
    line-height: 39px;

    color: #FFFFFF;
  }

  .text {
    position: relative;
    width: 359px;
    height: 78px;
    left: 30px;
    top: 30px;

    font-family: Heebo;
    font-style: normal;
    font-weight: normal;
    font-size: 24px;
    line-height: 39px;

    color: #FFFFFF;
  }

  .clearBoth { clear: both; }
</style>
