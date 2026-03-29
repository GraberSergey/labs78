<template>
  <header class="app-header">
    <div class="app-header__inner">
      <h1 class="app-header__title">3D-печать: Лабораторная работа 7</h1>
      <nav class="app-header__nav">
        <RouterLink to="/" class="app-link">Главная</RouterLink>
        <RouterLink to="/printers" class="app-link">Принтеры</RouterLink>
        <RouterLink to="/plastics" class="app-link">Пластики</RouterLink>
        <RouterLink to="/models" class="app-link">Модели</RouterLink>
      </nav>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  background: linear-gradient(120deg, #19344a, #2c6a8f);
  border-radius: 14px;
  color: #ffffff;
  margin: 1rem;
  padding: 1rem;
}

.app-header__inner {
  max-width: 1100px;
  margin: 0 auto;
}

.app-header__title {
  margin: 0;
  font-size: 1.3rem;
  font-weight: 700;
}

.app-header__nav {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.85rem;
}

.app-link {
  color: #ffffff;
  text-decoration: none;
  background: rgba(255, 255, 255, 0.18);
  border-radius: 10px;
  padding: 0.45rem 0.8rem;
}

.app-link.router-link-exact-active {
  background: #ffffff;
  color: #19344a;
  font-weight: 700;
}
</style>
