import { Component, lazy, Suspense, type ReactNode } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "../layouts/AppLayout";
const Garden = lazy(() =>
  import("../pages/Garden").then((m) => ({ default: m.Garden })),
);
const Placeholder = lazy(() =>
  import("../pages/Placeholder").then((m) => ({ default: m.Placeholder })),
);
const PlantForm = lazy(() =>
  import("../pages/PlantForm").then((m) => ({ default: m.PlantForm })),
);
const PlantDetail = lazy(() =>
  import("../pages/PlantDetail").then((m) => ({ default: m.PlantDetail })),
);
const Care = lazy(() =>
  import("../pages/Care/Care").then((m) => ({ default: m.Care })),
);
const Identify = lazy(() =>
  import("../pages/Care/Identify").then((m) => ({ default: m.Identify })),
);
const Chat = lazy(() =>
  import("../pages/Care/Chat").then((m) => ({ default: m.Chat })),
);
const Diagnosis = lazy(() =>
  import("../pages/Care/Diagnosis").then((m) => ({ default: m.Diagnosis })),
);
const CareCalendar = lazy(() =>
  import("../pages/Care/Calendar").then((m) => ({ default: m.CareCalendar })),
);
const Management = lazy(() =>
  import("../pages/Care/Management").then((m) => ({ default: m.Management })),
);
const Companion = lazy(() =>
  import("../pages/Companion/Companion").then((m) => ({
    default: m.Companion,
  })),
);
const Achievements = lazy(() =>
  import("../pages/Companion/Companion").then((m) => ({
    default: m.Achievements,
  })),
);
const VirtualGarden = lazy(() =>
  import("../pages/Companion/Companion").then((m) => ({
    default: m.VirtualGarden,
  })),
);
const CompanionChat = lazy(() =>
  import("../pages/Companion/Chat").then((m) => ({ default: m.CompanionChat })),
);
const Community = lazy(() =>
  import("../pages/Community/Community").then((m) => ({
    default: m.Community,
  })),
);
const ChannelPage = lazy(() =>
  import("../pages/Community/Channel").then((m) => ({
    default: m.ChannelPage,
  })),
);
const PostPage = lazy(() =>
  import("../pages/Community/Post").then((m) => ({ default: m.PostPage })),
);
const CreatePost = lazy(() =>
  import("../pages/Community/Create").then((m) => ({ default: m.CreatePost })),
);
const CommunitySearch = lazy(() =>
  import("../pages/Community/Search").then((m) => ({
    default: m.CommunitySearch,
  })),
);
const Profile = lazy(() =>
  import("../pages/Profile").then((m) => ({ default: m.Profile })),
);
const Account = lazy(() =>
  import("../pages/Account").then((m) => ({ default: m.Account })),
);
class ErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="empty-state">
        <h1>花园暂时无法打开</h1>
        <p>请刷新页面重试。你的养护记录保存在当前浏览器。</p>
        <button className="button" onClick={() => window.location.reload()}>
          刷新页面
        </button>
      </div>
    ) : (
      this.props.children
    );
  }
}
export function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Suspense
          fallback={
            <div className="route-loading" role="status">
              <span className="eyebrow">PLANT COMPANION</span>
              <p>正在打开植物空间…</p>
              <div className="skeleton" />
            </div>
          }
        >
          <Routes>
            <Route element={<AppLayout />}>
              <Route index element={<Navigate to="/garden" replace />} />
              <Route path="garden" element={<Garden />} />
              <Route path="plants/add" element={<PlantForm />} />
              <Route path="plants/:id/edit" element={<PlantForm />} />
              <Route path="plants/:id" element={<PlantDetail />} />
              <Route path="companion" element={<Companion />} />
              <Route
                path="companion/chat/:plantId"
                element={<CompanionChat />}
              />
              <Route path="companion/achievements" element={<Achievements />} />
              <Route path="companion/garden" element={<VirtualGarden />} />
              <Route path="community" element={<Community />} />
              <Route
                path="community/channels/:channelId"
                element={<ChannelPage />}
              />
              <Route path="community/posts/:postId" element={<PostPage />} />
              <Route path="community/create" element={<CreatePost />} />
              <Route path="community/search" element={<CommunitySearch />} />
              <Route path="profile" element={<Profile />} />
              <Route path="profile/posts" element={<Profile />} />
              <Route path="profile/favorites" element={<Profile />} />
              <Route path="care" element={<Care />} />
              <Route path="care/identify" element={<Identify />} />
              <Route path="care/chat" element={<Chat />} />
              <Route path="care/diagnosis" element={<Diagnosis />} />
              <Route path="care/calendar" element={<CareCalendar />} />
              {["watering", "fertilizing", "pruning"].map((kind) => (
                <Route
                  key={kind}
                  path={`care/${kind}`}
                  element={<Management kind={kind} />}
                />
              ))}
              {["edit", "devices", "settings"].map((section) => (
                <Route
                  key={section}
                  path={`profile/${section}`}
                  element={<Account />}
                />
              ))}
              {[
                "care/*",
                "companion/*",
                "community/*",
                "profile/*",
                "plants/*",
                "*",
              ].map((path) => (
                <Route key={path} path={path} element={<Placeholder />} />
              ))}
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
