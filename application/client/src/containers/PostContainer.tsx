import { useContext } from "react";

import { InfiniteScroll } from "@web-speed-hackathon-2026/client/src/components/foundation/InfiniteScroll";
import { PostPage } from "@web-speed-hackathon-2026/client/src/components/post/PostPage";
import { NotFoundContainer } from "@web-speed-hackathon-2026/client/src/containers/NotFoundContainer";
import { SSRDataContext } from "@web-speed-hackathon-2026/client/src/contexts/SSRDataContext";
import { useInfiniteFetch } from "@web-speed-hackathon-2026/client/src/hooks/use_infinite_fetch";
import { useTitle } from "@web-speed-hackathon-2026/client/src/hooks/use_title";
import { fetchJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

interface Props {
  postId?: string;
}

export const PostContainer = ({ postId }: Props) => {
  const ssrData = useContext(SSRDataContext);
  const post = (ssrData?.[`/api/v1/posts/${postId}`] ?? null) as Models.Post | null;

  const { data: comments, fetchMore, hasMore, isLoading: isLoadingComments } = useInfiniteFetch<Models.Comment>(
    `/api/v1/posts/${postId}/comments`,
    fetchJSON,
  );

  useTitle(post ? `${post.user.name} さんのつぶやき - CaX` : "CaX");

  if (post === null) {
    return <NotFoundContainer />;
  }

  return (
    <InfiniteScroll fetchMore={fetchMore} hasMore={hasMore} items={comments}>
      <PostPage comments={comments} isLoadingComments={isLoadingComments} post={post} />
    </InfiniteScroll>
  );
};
