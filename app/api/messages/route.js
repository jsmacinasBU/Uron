import { pusherServer } from "@lib/pusher";
import Chat from "@models/Chat";
import Message from "@models/Message";
import User from "@models/User";
import { connectToDB } from "@mongodb";
const { publicDecrypt } = require('crypto');
const NodeRSA = require('node-rsa');

const RSA_PRIVATE_KEY = process.env.RSA_PRIVATE_KEY;
const RSA_PUBLIC_KEY = process.env.RSA_PUBLIC_KEY;

const key_private = new NodeRSA(RSA_PRIVATE_KEY);
const key_public = new NodeRSA(RSA_PUBLIC_KEY);

export const POST = async (req) => {
  try {
    await connectToDB();

    const body = await req.json();

    const { chatId, currentUserId, text } = body;

    const currentUser = await User.findById(currentUserId);

    let encryptedText = key_public.encrypt(text, 'base64');

    const newMessage = await Message.create({
      chat: chatId,
      sender: currentUser,
      text: encryptedText,
      seenBy: currentUserId,
    });

    let decryptedText = key_private.decrypt(encryptedText, 'utf8');
    newMessage.text = decryptedText;

    const updatedChat = await Chat.findByIdAndUpdate(
      chatId,
      {
        $push: { messages: newMessage._id },
        $set: { lastMessageAt: newMessage.createdAt },
      },
      { new: true }
    )
      .populate({
        path: "messages",
        model: Message,
        populate: { path: "sender seenBy", model: "User" },
      })
      .populate({
        path: "members",
        model: "User",
      })
      .exec();

    await pusherServer.trigger(chatId, "new-message", newMessage)

    const lastMessage = updatedChat.messages[updatedChat.messages.length - 1];
    updatedChat.members.forEach(async (member) => {
      try {
        await pusherServer.trigger(member._id.toString(), "update-chat", {
          id: chatId,
          messages: [lastMessage]
        });
      } catch (err) {
        console.error(`Failed to trigger update-chat event`);
      }
    });

    return new Response(JSON.stringify(newMessage), { status: 200 });
  } catch (err) {
    console.log(err);
    return new Response("Failed to create new message", { status: 500 });
  }
};