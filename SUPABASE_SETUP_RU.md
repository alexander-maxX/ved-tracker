# Настройка бесплатной синхронизации через Supabase

Supabase — это бесплатная и мощная альтернатива Firebase. Она отлично работает в Беларуси и России, не требует привязки банковской карты и легко настраивается.

## 1. Регистрация
1. Откройте [supabase.com](https://supabase.com) (работает без VPN)
2. Нажмите **"Start your project"**
3. Зарегистрируйтесь (проще всего нажать "Continue with GitHub")

## 2. Создание проекта
1. Нажмите **"New project"**
2. Введите название: `ved-tracker`
3. Установите надёжный пароль для базы данных
4. Выберите ближайший регион (например: `Central EU (Frankfurt)`)
5. Дождитесь, пока проект настроится (около 2-3 минут)

## 3. Настройка базы данных
Нам нужно создать всего одну таблицу для хранения данных пользователей.

1. В левом меню нажмите на иконку **SQL Editor** (значок кода)
2. Нажмите **"New query"**
3. Вставьте этот код в редактор:

```sql
create table user_data (
  id uuid primary key references auth.users on delete cascade,
  data jsonb not null default '{}'::jsonb
);

-- Настраиваем безопасность, чтобы никто не мог украсть чужие данные
alter table user_data enable row level security;

create policy "Users can read own data" on user_data
  for select using (auth.uid() = id);

create policy "Users can update own data" on user_data
  for update using (auth.uid() = id);

create policy "Users can insert own data" on user_data
  for insert with check (auth.uid() = id);
```
4. Нажмите кнопку **"Run"** в правом нижнем углу. Если написано "Success", всё готово!

## 4. Подключение к нашему приложению
1. В левом меню нажмите на **Project Settings** (иконка шестеренки в самом низу)
2. Перейдите в раздел **API**
3. Скопируйте **Project URL**
4. Скопируйте **Project API keys: anon / public**
5. Откройте файл `src/supabase.ts` в нашем коде
6. Вставьте скопированные значения вместо заглушек:

```typescript
const supabaseUrl = "ВАШ_URL";
const supabaseAnonKey = "ВАШ_КЛЮЧ";
```

## 5. Запуск
```bash
npm run build
```
Готово! Загрузите папку `dist` на любой бесплатный хостинг (Netlify Drop, Vercel или GitHub Pages). 

Теперь любой пользователь сможет зарегистрироваться, и его инвойсы будут мгновенно сохраняться в вашу базу данных Supabase и синхронизироваться на всех его устройствах!
