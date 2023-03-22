<template>
  <div style="height: 100vh" class="flex-column">
    <div class="tab-nav">
      <div v-for="tab in tabs" :key="tab.key" class="tab" :class="{
        active: activeKey == tab.key,
      }">
        <div class="tab-title" @click="changeTab(tab.key)">
          <!-- <img class="icon" :src="activeKey == tab.key ? tab.icon : tab.inactivateIcon" /> -->
          <span>{{ tab.title }}</span>
        </div>
      </div>
    </div>
    <div class="main" style="margin-top: 20px">
      <div v-show="activeKey == 'tcpClient'">
        <tcp-view />
      </div>
      <div v-show="activeKey == 'tcpServer'">
        <tcp-server-view />
      </div>
      <div v-show="activeKey == 'udp'">
        <udp-view />
      </div>
      <div v-show="activeKey == 'serial'">
        <serial-view />
      </div>
    </div>
  </div>
</template>

<script setup>
import TcpView from "./views/TcpView.vue";
import UdpView from "./views/UdpView.vue";
import TcpServerView from "./views/TcpServerView.vue";
import SerialView from "./views/SerialView.vue";
import { ref, reactive } from "vue";

const activeKey = ref("tcpClient");
const tabs = reactive([
  {
    key: "tcpClient",
    title: "TCP Client",
    // icon: require("@/assets/icons/tabs/training_active.png"),
    // inactivateIcon: require("@/assets/icons/tabs/training.png"),
  },
  {
    key: "tcpServer",
    title: "TCP Server",
  },
  {
    key: "udp",
    title: "UDP",
  },
  {
    key: "serial",
    title: "串口",
  }
])
const changeTab = (key) => {
  activeKey.value = key;
};
</script>

<style lang="less" scoped>
.tab-nav {
  display: flex;
  width: 100%;
  justify-content: space-between;
  align-items: center;
  height: 30px;
  // border-top: 1px solid rgba(206, 224, 230, 0.04);
  // border-bottom: 1px solid #ddd;

  font-family: MicrosoftYaHei;
  font-size: 20px;
  color: rgba(0, 0, 0, 0.6);
  line-height: 24px;
  font-weight: 400;

  .active {
    color: rgba(0, 0, 0, 0.8);
    font-weight: 700;
  }

}

.tab {
  background-color: white;
  flex: 1;
  height: 100%;
  color: gray;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;

  &::before {
      content: "";
      position: absolute;
      left: 0;
      right: 0;
      top: 5px;
      bottom: 5px;
      width: 1px;
      background-color: #ccc;
    }

    &:first-child::before {
      content: "";
      background: none;
    }
}

.tab-title {
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.icon {
  width: 20px;
  height: 20px;
  margin-right: 10px;
}

.title:hover {
  cursor: pointer;
}

.main {
  padding: 0;
  flex-grow: 1;
  padding: 20px;

  div {
    height: 100%;
  }
}
</style>
