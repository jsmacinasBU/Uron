import { pusherServer } from "@lib/pusher";
import Chat from "@models/Chat";
import User from "@models/User";
import { connectToDB } from "@mongodb";

export const POST = async (req) => {
  try {
    await connectToDB();

    const body = await req.json();

    const { currentUserId, members, isGroup, name, groupPhoto } = body;

    const query = isGroup
      ? { isGroup, name, groupPhoto, members: [currentUserId, ...members] }
      : { members: { $all: [currentUserId, ...members], $size: 2 } };

    let chat = await Chat.findOne(query);

    if (!chat) {
      chat = await new Chat(
        isGroup ? query : { members: [currentUserId, ...members] }
      );

      await chat.save();

      const updateAllMembers = chat.members.map(async (memberId) => {
        await User.findByIdAndUpdate(
          memberId,
          {
            $addToSet: { chats: chat._id },
          },
          { new: true }
        );
      }) 
      Promise.all(updateAllMembers);
      
      if (!isGroup) {
        const otherMemberId = members.find(member => member !== currentUserId);
        const otherMember = await User.findById(otherMemberId);
        const currentUser = await User.findById(currentUserId);
        chat.name = `${otherMember.username} ${currentUser.username}`;
        await chat.save();
      }

      chat.members.map(async (member) => {
        await pusherServer.trigger(member._id.toString(), "new-chat", chat)
      })
    }


    return new Response(JSON.stringify(chat), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response("Failed to create a new chat", { status: 500 })
  }
};
