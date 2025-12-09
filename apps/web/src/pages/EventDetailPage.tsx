import { useParams } from "react-router";

const EventDetailPage = () => {
  const { id } = useParams();
  // TODO: create page
  return <>Event detail page: {id}</>;
};

export default EventDetailPage;
