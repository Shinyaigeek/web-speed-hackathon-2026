import { lazy, Suspense, useContext } from "react";

import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";
import { PostPage } from "@web-speed-hackathon-2026/client/src/components/post/PostPage";
import { NotFoundContainer } from "@web-speed-hackathon-2026/client/src/containers/NotFoundContainer";
import { SSRDataContext } from "@web-speed-hackathon-2026/client/src/contexts/SSRDataContext";
import { useTitle } from "@web-speed-hackathon-2026/client/src/hooks/use_title";

const CommentSection = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/components/post/CommentSection").then((m) => ({
    default: m.CommentSection,
  })),
);

interface Props {
  postId?: string;
}

export const PostContainer = ({ postId }: Props) => {
  const ssrData = useContext(SSRDataContext);
  const post = (ssrData?.[`/api/v1/posts/${postId}`] ?? null) as Models.Post | null;

  useTitle(post ? `${post.user.name} さんのつぶやき - CaX` : "CaX");

  if (post === null) {
    return <NotFoundContainer />;
  }

  return (
    <PostPage post={post}>
      <Suspense
        fallback={
          <div className="flex justify-center py-4">
            <span className="text-cax-text-muted animate-spin text-xl">
              <FontAwesomeIcon iconType="circle-notch" styleType="solid" />
            </span>
          </div>
        }
      >
        <CommentSection postId={postId!} />
      </Suspense>
    </PostPage>
  );
};
