import { Bot, Context, InlineKeyboard, InputFile, Keyboard, session } from "grammy";
import {
    type Conversation,
    type ConversationFlavor,
    conversations,
    createConversation,
} from "@grammyjs/conversations";
import { Menu } from "@grammyjs/menu";

import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import dotenv from 'dotenv';

import fs from "fs";

dotenv.config();

type BulletType = {
    description: string
}
type WorkExperienceType = {
    title: string,
    company: string,
    period: string,
    team_name: string,
    location: string,
    bullets: BulletType[]
}

type EducationType = {
    degree_title: string,
    school_name: string,
    period: string
}


type MyContext = Context & ConversationFlavor;
type MyConversation = Conversation<MyContext>;

//Create a new bot
const bot = new Bot<MyContext>(process.env.TELEGRAM_BOT_API_KEY!);

// install session plugin (needed by conversations plugin)
bot.use(session({ initial: () => ({}) }));
// install conversation plugin
bot.use(conversations());

// Ask yes or no until correct answer is given (i.e 'yes' or 'no')
async function ask_yes_no(conversation: MyConversation, ctx: MyContext, message: string) {
    while (true) {
        await ctx.reply(message);
        let answer = (await conversation.waitFor(":text")).msg.text.toLowerCase();
        if (answer == "no") {
            return false;
        }
        else if (answer == "yes") {
            return true;
        }
    }

}

/** Defines the conversation */
async function resume_generation(conversation: MyConversation, ctx: MyContext) {
    let id_telegram = ctx.message?.from.id;
    let message = "";
    message += "📩 Generating resume 📩";
    message += "\n\n";
    await ctx.reply(message, { parse_mode: "HTML" });

    await ctx.reply("1️⃣ What's your full name ? (ex: John Doe)");
    const full_name = (await conversation.waitFor(":text")).msg.text;

    message += `📑 <u>Full name</u>: <b>${full_name}</b>`;
    await ctx.reply(message, { parse_mode: "HTML" });

    await ctx.reply("2️⃣ What is your location ? (ex: Paris, France)");
    const location = (await conversation.waitFor(":text")).msg.text;


    message += `\n📑 <u>Location</u>: <b>${location}</b>`;
    await ctx.reply(message, { parse_mode: "HTML" });

    await ctx.reply("3️⃣ What is your contact ? (mail / phone number)");
    const contact = (await conversation.waitFor(":text")).msg.text;

    message += `\n📑 <u>Contact</u>: <b>${contact}</b>`;
    await ctx.reply(message, { parse_mode: "HTML" });

    await ctx.reply("4️⃣ Link to LinkedIn profile\nSend 'empty' to ignore");
    let linkedin = (await conversation.waitFor(":text")).msg.text;
    if (linkedin == "empty") { linkedin = "" };

    message += `\n📑 <u>LinkedIn</u>: <b>${linkedin}</b>`;
    await ctx.reply(message, { parse_mode: "HTML" });

    await ctx.reply("5️⃣ Link to GitHub profile\nSend 'empty' to ignore");
    let github = (await conversation.waitFor(":text")).msg.text;
    if (github == "empty") { github = "" };

    message += `\n📑 <u>GitHub</u>: <b>${github}</b>`;
    await ctx.reply(message, { parse_mode: "HTML" });

    await ctx.reply("6️⃣ Languages you use ? (ex: 'Java, Kotlin, Python')");
    const languages = (await conversation.waitFor(":text")).msg.text;

    message += `\n📑 <u>Languages</u>: <b>${languages}</b>`;
    await ctx.reply(message, { parse_mode: "HTML" });

    await ctx.reply("7️⃣ Technologies you use ? (ex: 'ReactJS, Docker, Unix, TensorFlow')");
    const technologies = (await conversation.waitFor(":text")).msg.text;

    message += `\n📑 <u>Technologies</u>: <b>${technologies}</b>`;
    await ctx.reply(message, { parse_mode: "HTML" });

    await ctx.reply("8️⃣ Other skills ? (ex: 'Data Structures, Linear Algebra')");
    const other = (await conversation.waitFor(":text")).msg.text;

    message += `\n📑 <u>Other</u>: <b>${other}</b>`;
    message += `\n\n<b><u>👷 Work experience 👷</u></b>`;
    await ctx.reply(message, { parse_mode: "HTML" });

    let work_experience: WorkExperienceType[] = [];
    let keep_adding: boolean = await ask_yes_no(conversation, ctx, "👷 Do you want to add another work experience ? (yes/no)");

    while (keep_adding) {
        message += `\n\n🔹`;
        // Prompt all the items of work_experience
        await ctx.reply(message, { parse_mode: "HTML" });

        // title company period team_name location bullets
        await ctx.reply("🤵 Job title ? (ex: Software Engineer Intern)");
        const title = (await conversation.waitFor(":text")).msg.text;
        message += ` ${title}`;

        await ctx.reply("🏙️ Company name ? (ex: Google)");
        const company = (await conversation.waitFor(":text")).msg.text;

        message += ` at ${company}`

        await ctx.reply("🗓️ Period ? (ex: 2015-2018)");
        const period = (await conversation.waitFor(":text")).msg.text;


        await ctx.reply("🌇 Team name ? (ex: payments team)\nSend 'empty' to ignore");
        let team_name = (await conversation.waitFor(":text")).msg.text;
        if (team_name == "empty") { team_name = "" };



        await ctx.reply("🌎 Location ? (ex: Amsterdam, Netherlands)");
        const location = (await conversation.waitFor(":text")).msg.text;

        message += ` (${team_name} | ${period} | ${location})`;


        let bullets: BulletType[] = [];
        await ctx.reply("🔸 Add bullets to describe what you did during this experience (ex: switching all the codebase from C to OCaml)")
        let keep_adding_bullets: boolean = await ask_yes_no(conversation, ctx, "Do you want to another bullet ? (yes/no)");
        while (keep_adding_bullets) {
            await ctx.reply("Give a description for this bullet");
            const description = (await conversation.waitFor(":text")).msg.text;
            message += `\n\t\t▫️ ${description}`;
            bullets.push({ description })

            keep_adding_bullets = await ask_yes_no(conversation, ctx, "Do you want to another bullet ? (yes/no)");
        }

        // add items to the list
        work_experience.push({ title, company, period, team_name, location, bullets })

        await ctx.reply(message, { parse_mode: "HTML" });
        // Prompt to know if we keep going
        keep_adding = await ask_yes_no(conversation, ctx, "Do you want to another work experience ? (yes/no)");
    }

    message += `\n\n<b><u>🧑‍🎓 Education 🧑‍🎓</u></b>`
    await ctx.reply(message, { parse_mode: "HTML" });

    let education: EducationType[] = [];

    keep_adding = await ask_yes_no(conversation, ctx, "🧑‍🏫 Do you want to add another education item ? (yes/no)");
    while (keep_adding) {
        message += `\n\n🔸`;
        await ctx.reply(message, { parse_mode: "HTML" });


        await ctx.reply("🧑‍🎓 Degree title ? (ex: Bachelor in Computer Science)");
        const degree_title = (await conversation.waitFor(":text")).msg.text;

        message += ` ${degree_title}`;

        await ctx.reply("🏫 School / College name ? (ex: University of Berkeley, California)");
        const school_name = (await conversation.waitFor(":text")).msg.text;

        message += ` at ${school_name}`;

        await ctx.reply("🗓️ Period ? (ex: Sept 2019 - Jun 2022)");
        const period = (await conversation.waitFor(":text")).msg.text;

        message += ` (${period})`;
        await ctx.reply(message, { parse_mode: "HTML" });

        education.push({ degree_title, school_name, period });


        keep_adding = await ask_yes_no(conversation, ctx, "Do you want to add another education item ? (yes/no)");
    }

    // Load the docx file as binary content
    const content = fs.readFileSync(`./resume_template.docx`,
        "binary"
    );

    // Unzip the content of the file
    const zip = new PizZip(content);

    // This will parse the template, and will throw an error if the template is
    // invalid, for example, if the template is "{user" (no closing tag)
    const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
    });

    doc.render({
        full_name,
        location,
        contact,
        linkedin,
        github,
        work_experience,
        education,
        languages,
        technologies,
        other
    });

    // Get the zip document and generate it as a nodebuffer
    const buf = doc.getZip().generate({
        type: "nodebuffer",
        // compression: DEFLATE adds a compression step.
        // For a 50MB output document, expect 500ms additional CPU time
        compression: "DEFLATE",
    });

    // buf is a nodejs Buffer, you can either write it to a
    // file or res.send it with express for example.
    let output_path = `./output/${id_telegram}.docx`
    fs.writeFileSync(output_path, buf);

    await ctx.replyWithDocument(new InputFile(output_path));

    fs.rmSync(output_path);

    await ctx.reply(`✅ <b>Done ! </b> ✅\n\n
                    Here is your .docx file that you can modify if needed, and convert to PDF.\n\n
                    <i>We do not store your data, your file has already been removed from our server.</i>`,
        { parse_mode: "HTML" });
}
bot.use(createConversation(resume_generation));


bot.command("start", async (ctx) => {
    await ctx.reply(`📕 <b>Resume Generator</b> 📕\n
✨ This bot can help you create a resume in under 5 minutes !\n
📝 Simply answer few questions to fill a template, and you'll get the .docx file that you can modify as you wish.\n 
⚙️ Start with command /generate\n
<i>Your data is not stored, it's removed as soon as the template is generated</i>`,
        { parse_mode: "HTML" });
});

bot.command("generate", async (ctx) => {
    await ctx.conversation.enter("resume_generation");
});



//Start the Bot
bot.start();


